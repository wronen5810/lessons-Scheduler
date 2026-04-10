import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/admin/teachers — list all teacher profiles
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, is_active, phone, created_at')
    .eq('role', 'teacher')
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with email from auth.users
  const enriched = await Promise.all(
    (data ?? []).map(async (p) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(p.id);
      return { ...p, email: user?.email ?? '' };
    })
  );

  return NextResponse.json(enriched);
}

// POST /api/admin/teachers — create a new teacher account
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { email, display_name, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Create Supabase auth user
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !user) {
    return NextResponse.json({ error: createError?.message ?? 'Failed to create user' }, { status: 500 });
  }

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    role: 'teacher',
    display_name: display_name || email,
    is_active: true,
  });

  if (profileError) {
    // Rollback auth user
    await supabase.auth.admin.deleteUser(user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ id: user.id, email, display_name: display_name || email, is_active: true }, { status: 201 });
}
