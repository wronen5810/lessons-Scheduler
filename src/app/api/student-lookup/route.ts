import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { issueStudentToken } from '@/lib/student-token';

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

  // If any active record has 2FA enabled, stop here — client will prompt for TOTP code
  if (active.some((s) => s.two_factor_enabled)) {
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
