import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { issueStudentToken } from '@/lib/student-token';
import { createHash, randomInt } from 'crypto';
import { Resend } from 'resend';

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

async function sendOtp(email: string): Promise<boolean> {
  const supabase = createServiceSupabase();
  await supabase.from('student_otp_codes').delete().eq('email', email);

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const { error } = await supabase.from('student_otp_codes').insert({
    email,
    code_hash: hashCode(code),
    expires_at: expiresAt.toISOString(),
  });
  if (error) return false;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `Your login code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
          <h2>Your Login Code</h2>
          <p>Use the code below to complete your login. It expires in 10 minutes.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#f5f5f5;border-radius:8px;margin:16px 0">
            ${code}
          </div>
          <p style="font-size:13px;color:#888">If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

function stripPhoneFormatting(phone: string): string {
  return phone.replace(/[\s\-().]/g, '');
}

// POST /api/student-lookup — find which teacher(s) a student belongs to
// body.identifier: email or phone number (body.email also accepted for backward compat)
// Optional body.teacherId: scope lookup to a specific teacher (used by /join/[teacherId])
export async function POST(request: NextRequest) {
  const body = await request.json();
  const rawIdentifier: string = body.identifier ?? body.email ?? '';
  const teacherId: string | undefined = body.teacherId;

  if (!rawIdentifier) return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });

  const trimmed = rawIdentifier.trim();
  const isEmail = trimmed.includes('@');
  const supabase = createServiceSupabase();

  let query = supabase
    .from('students')
    .select('teacher_id, is_active, privacy_accepted_at, email, phone, name, two_factor_enabled');

  if (isEmail) {
    query = query.ilike('email', trimmed.toLowerCase());
  } else {
    const stripped = stripPhoneFormatting(trimmed);
    const phoneFilter = stripped !== trimmed
      ? `phone.eq.${trimmed},phone.eq.${stripped}`
      : `phone.eq.${trimmed}`;
    query = query.or(phoneFilter);
  }

  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }

  const { data, error } = await query;

  // Not found at all
  if (error || !data || data.length === 0) {
    if (teacherId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', teacherId)
        .single();
      return NextResponse.json(
        { error: 'Not registered', not_registered: true, teacher_name: profile?.display_name ?? '' },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: 'Not found. Please contact your teacher.' }, { status: 404 });
  }

  type StudentRow = { teacher_id: string; is_active: boolean; privacy_accepted_at: string | null; email: string | null; phone: string | null; name: string; two_factor_enabled: boolean };
  const active = (data as StudentRow[]).filter((s) => s.is_active);
  if (active.length === 0) {
    return NextResponse.json({ error: 'Your account is inactive. Please contact your teacher.' }, { status: 403 });
  }

  const studentIdentifier = (active[0].email ?? active[0].phone ?? '').toLowerCase().trim();
  const privacyAccepted = active.some((s) => s.privacy_accepted_at !== null);
  const teacherIds = active.map((s) => s.teacher_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', teacherIds);

  const teachers = (profiles ?? []).map((p: { id: string; display_name: string }) => ({
    id: p.id,
    display_name: p.display_name,
  }));

  const logName = active[0].name ?? studentIdentifier;
  await supabase.from('student_logins').insert(
    teacherIds.map((tid) => ({
      teacher_id: tid,
      student_email: studentIdentifier,
      student_name: logName,
    }))
  );

  // If any active record has 2FA enabled, send OTP and stop here
  const requires2FA = active.some((s) => s.two_factor_enabled);
  if (requires2FA) {
    const sent = await sendOtp(studentIdentifier);
    if (!sent) return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    return NextResponse.json({ requires_2fa: true, student_email: studentIdentifier });
  }

  // Issue tokens only for teachers where privacy has already been accepted
  const tokens: Record<string, string> = {};
  for (const s of active) {
    if (s.privacy_accepted_at !== null) {
      tokens[s.teacher_id] = issueStudentToken(studentIdentifier, s.teacher_id);
    }
  }

  return NextResponse.json({ teachers, privacy_accepted: privacyAccepted, tokens, student_email: studentIdentifier });
}
