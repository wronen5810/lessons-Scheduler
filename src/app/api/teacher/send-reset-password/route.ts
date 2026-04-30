import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';
import { emailTeacherPasswordReset } from '@/lib/email';

// POST /api/teacher/send-reset-password — public, no auth required
// Body: { email: string }
export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Look up the teacher by email
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase().trim());

  // Always return success to avoid user enumeration
  if (!user) return NextResponse.json({ ok: true });

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';

  // Generate reset token valid for 2 hours
  const resetToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const { error: tokenError } = await supabase
    .from('profiles')
    .update({ setup_token: resetToken, setup_token_expires_at: expiresAt })
    .eq('id', user.id);

  if (tokenError) {
    console.error('[send-reset-password] token save failed:', tokenError.message);
    return NextResponse.json({ ok: true }); // still return ok, don't leak DB errors
  }

  const resetLink = `${baseUrl}/teacher/set-password?token=${resetToken}`;

  try {
    await emailTeacherPasswordReset({
      teacherName: profile?.display_name ?? email,
      teacherEmail: user.email!,
      resetLink,
    });
  } catch (e) {
    console.error('[send-reset-password] email failed:', e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true });
}
