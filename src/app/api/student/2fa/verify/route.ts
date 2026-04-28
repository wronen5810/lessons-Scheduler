import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { issueStudentToken } from '@/lib/student-token';
import { verifyTotp } from '@/lib/mfa';

// POST /api/student/2fa/verify
// Called during login when 2FA is enabled. Verifies TOTP code and issues session tokens.
export async function POST(request: NextRequest) {
  const { email, code } = await request.json() as { email: string; code: string };
  if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceSupabase();

  const { data: students } = await supabase
    .from('students')
    .select('teacher_id, privacy_accepted_at, totp_secret, two_factor_enabled')
    .ilike('email', normalizedEmail)
    .eq('is_active', true);

  if (!students || students.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Any record with 2FA enabled must have its secret verified
  const mfaRecord = students.find((s) => s.two_factor_enabled && s.totp_secret);
  if (!mfaRecord) {
    return NextResponse.json({ error: '2FA not configured' }, { status: 400 });
  }

  if (!verifyTotp(code, mfaRecord.totp_secret!)) {
    return NextResponse.json({ error: 'Invalid code — try again' }, { status: 400 });
  }

  const tokens: Record<string, string> = {};
  for (const s of students) {
    if (s.privacy_accepted_at !== null) {
      tokens[s.teacher_id] = issueStudentToken(normalizedEmail, s.teacher_id);
    }
  }

  const teacherIds = students.map((s) => s.teacher_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', teacherIds);

  const teachers = (profiles ?? []).map((p: { id: string; display_name: string }) => ({
    id: p.id,
    display_name: p.display_name,
  }));

  const privacyAccepted = students.some((s) => s.privacy_accepted_at !== null);

  return NextResponse.json({ ok: true, tokens, teachers, student_email: normalizedEmail, privacy_accepted: privacyAccepted });
}
