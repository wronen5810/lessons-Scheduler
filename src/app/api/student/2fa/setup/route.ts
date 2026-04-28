import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createServiceSupabase } from '@/lib/supabase-server';
import { claimsFromRequest } from '@/lib/student-token';
import { generateTotpSecret, getTotpUri } from '@/lib/mfa';

// POST /api/student/2fa/setup
// Generates a fresh TOTP secret, stores it (not yet enabled), returns QR data URL + plain secret.
export async function POST(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceSupabase();

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('teacher_id', claims.teacherId)
    .ilike('email', claims.email)
    .single();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const secret = generateTotpSecret();
  const uri = getTotpUri(claims.email, secret);
  const qr = await QRCode.toDataURL(uri);

  await supabase.from('students').update({ totp_secret: secret }).eq('id', student.id);

  return NextResponse.json({ qr, secret });
}
