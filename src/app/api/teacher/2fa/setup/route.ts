import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { requireTeacherSession } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { generateTotpSecret, getTotpUri } from '@/lib/mfa';

// POST /api/teacher/2fa/setup
// Generates a fresh TOTP secret, stores it (not yet enabled), returns QR data URL + plain secret.
export async function POST() {
  const auth = await requireTeacherSession();
  if (auth.error) return auth.error;

  const secret = generateTotpSecret();
  const uri = getTotpUri(auth.user.email!, secret);
  const qr = await QRCode.toDataURL(uri);

  const supabase = createServiceSupabase();
  await supabase
    .from('teacher_settings')
    .upsert({ teacher_id: auth.user.id, totp_secret: secret, updated_at: new Date().toISOString() });

  return NextResponse.json({ qr, secret });
}
