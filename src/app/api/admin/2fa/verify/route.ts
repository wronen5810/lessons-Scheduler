import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { verifyTotp, signMfaCookie, ADMIN_MFA_COOKIE, ADMIN_MFA_COOKIE_MAX_AGE } from '@/lib/mfa';

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from('profiles')
    .select('totp_secret')
    .eq('id', auth.user.id)
    .single();

  if (!data?.totp_secret) return NextResponse.json({ error: '2FA not configured' }, { status: 400 });
  if (!verifyTotp(code, data.totp_secret)) return NextResponse.json({ error: 'Invalid code — try again' }, { status: 400 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_MFA_COOKIE, signMfaCookie(auth.user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_MFA_COOKIE_MAX_AGE,
  });
  return response;
}
