import { NextRequest, NextResponse } from 'next/server';
import { requireTeacherSession } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { verifyTotp, MFA_COOKIE } from '@/lib/mfa';

// POST /api/teacher/2fa/disable
// Requires the current TOTP code to confirm intent, then clears 2FA.
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
    return NextResponse.json({ error: '2FA is not configured' }, { status: 400 });
  }

  if (!verifyTotp(code, data.totp_secret)) {
    return NextResponse.json({ error: 'Invalid code — try again' }, { status: 400 });
  }

  await supabase.from('profiles').update({ totp_enabled: false }).eq('id', auth.user.id);
  await supabase
    .from('teacher_settings')
    .update({ totp_secret: null })
    .eq('teacher_id', auth.user.id);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(MFA_COOKIE);
  return response;
}
