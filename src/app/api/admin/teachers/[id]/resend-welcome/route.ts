import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';
import { emailTeacherWelcome } from '@/lib/email';

// POST /api/admin/teachers/[id]/resend-welcome
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();

  // Get teacher profile + email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

  const { data: { user } } = await supabase.auth.admin.getUserById(id);
  if (!user?.email) return NextResponse.json({ error: 'Teacher email not found' }, { status: 404 });

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '').trim();

  // Generate fresh token (48 h)
  const setupToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error: tokenError } = await supabase
    .from('profiles')
    .update({ setup_token: setupToken, setup_token_expires_at: expiresAt })
    .eq('id', id);

  if (tokenError) {
    return NextResponse.json({ error: 'Could not save token — run add_setup_token.sql migration' }, { status: 500 });
  }

  const setPasswordLink = `${baseUrl}/teacher/set-password?token=${setupToken}`;

  try {
    await emailTeacherWelcome({
      teacherName: profile.display_name,
      teacherEmail: user.email,
      setPasswordLink,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Email failed: ${msg}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent_to: user.email });
}
