import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';

// PATCH /api/admin/subscription-requests/[id]
// body: { action: 'approve' | 'reject', display_name?: string }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { action, display_name } = await request.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const { data: req } = await supabase
    .from('teacher_subscription_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  if (action === 'reject') {
    await supabase.from('teacher_subscription_requests').update({ status: 'rejected' }).eq('id', id);
    return NextResponse.json({ ok: true });
  }

  // Approve: create teacher account
  const tempPassword = randomBytes(16).toString('hex');
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email: req.email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !user) {
    return NextResponse.json({ error: createError?.message ?? 'Failed to create user' }, { status: 500 });
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    role: 'teacher',
    display_name: display_name || req.name,
    phone: req.phone || null,
    is_active: true,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Send magic link so teacher can log in without knowing the temp password
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ?? '';
  await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: req.email,
    options: { redirectTo: `${baseUrl}/auth/callback` },
  });

  await supabase.from('teacher_subscription_requests').update({ status: 'approved' }).eq('id', id);

  return NextResponse.json({ ok: true, teacher_id: user.id });
}
