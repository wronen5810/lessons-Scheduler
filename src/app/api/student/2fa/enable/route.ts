import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { claimsFromRequest } from '@/lib/student-token';
import { verifyTotp } from '@/lib/mfa';

// POST /api/student/2fa/enable
// Verifies TOTP code against stored secret then sets two_factor_enabled = true.
export async function POST(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await request.json() as { code: string };
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const supabase = createServiceSupabase();

  const { data: student } = await supabase
    .from('students')
    .select('id, totp_secret')
    .eq('teacher_id', claims.teacherId)
    .ilike('email', claims.email)
    .single();

  if (!student?.totp_secret) {
    return NextResponse.json({ error: 'Run setup first' }, { status: 400 });
  }

  if (!verifyTotp(code, student.totp_secret)) {
    return NextResponse.json({ error: 'Invalid code — try again' }, { status: 400 });
  }

  await supabase.from('students').update({ two_factor_enabled: true }).eq('id', student.id);

  return NextResponse.json({ ok: true });
}
