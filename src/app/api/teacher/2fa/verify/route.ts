import { NextRequest, NextResponse } from 'next/server';
import { requireTeacherSession } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { verifyTotp, signMfaCookie, MFA_COOKIE, MFA_COOKIE_MAX_AGE } from '@/lib/mfa';

// POST /api/teacher/2fa/verify
// Called during login after password auth succeeds. Verifies TOTP code and sets the MFA cookie.
export async function POST(request: NextRequest) {
  const auth = await requireTeacherSession();
  if (auth.error) return auth.error;

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from('teacher_settings')
    .select('totp_secret')
    .eq('teacher_id', auth.user.id)
    .single();

  if (!data?.totp_secret) {
    return NextResponse.json({ error: '2FA not configured' }, { status: 400 });
  }

  if (!verifyTotp(code, data.totp_secret)) {
    return NextResponse.json({ error: 'Invalid code — try again' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MFA_COOKIE, signMfaCookie(auth.user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MFA_COOKIE_MAX_AGE,
  });
  return response;
}
