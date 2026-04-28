import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { createHash } from 'crypto';
import { issueStudentToken } from '@/lib/student-token';

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

// POST /api/student/2fa/verify-otp
// Body: { email, code }
// Verifies the OTP and, if valid, issues student tokens for all active teachers.
export async function POST(request: NextRequest) {
  const { email, code } = await request.json() as { email: string; code: string };
  if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceSupabase();

  const { data: otpRow } = await supabase
    .from('student_otp_codes')
    .select('id, code_hash, expires_at')
    .eq('email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!otpRow) {
    return NextResponse.json({ error: 'No code found. Please request a new one.' }, { status: 400 });
  }

  if (new Date(otpRow.expires_at) < new Date()) {
    await supabase.from('student_otp_codes').delete().eq('id', otpRow.id);
    return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
  }

  if (otpRow.code_hash !== hashCode(code.trim())) {
    return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
  }

  // Valid — delete the OTP and issue tokens
  await supabase.from('student_otp_codes').delete().eq('id', otpRow.id);

  const { data: students } = await supabase
    .from('students')
    .select('teacher_id, privacy_accepted_at')
    .ilike('email', normalizedEmail)
    .eq('is_active', true);

  const tokens: Record<string, string> = {};
  for (const s of students ?? []) {
    if (s.privacy_accepted_at !== null) {
      tokens[s.teacher_id] = issueStudentToken(normalizedEmail, s.teacher_id);
    }
  }

  const teacherIds = (students ?? []).map((s) => s.teacher_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', teacherIds);

  const teachers = (profiles ?? []).map((p: { id: string; display_name: string }) => ({
    id: p.id,
    display_name: p.display_name,
  }));

  return NextResponse.json({ ok: true, tokens, teachers, student_email: normalizedEmail });
}
