import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/admin/teachers/[id]/impersonate
// Generates a magic link that logs the admin in as the teacher (opens in new tab)
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();

  // Get teacher's email
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(id);
  if (userError || !user?.email) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  // Generate a magic link that routes through /auth/callback so the session
  // cookie is set before redirecting to /teacher
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? 'Failed to generate link' }, { status: 500 });
  }

  return NextResponse.json({ url: data.properties.action_link });
}
