import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { requireAdminSession } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { generateTotpSecret, getTotpUri } from '@/lib/mfa';

export async function POST() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const secret = generateTotpSecret();
  const uri = getTotpUri(auth.user.email!, secret);
  const qr = await QRCode.toDataURL(uri);

  const supabase = createServiceSupabase();
  await supabase.from('profiles').update({ totp_secret: secret }).eq('id', auth.user.id);

  return NextResponse.json({ qr, secret });
}
