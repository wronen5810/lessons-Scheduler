import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/student-lookup — find which teacher(s) a student belongs to
// Optional body.teacherId: scope lookup to a specific teacher (used by /join/[teacherId])
export async function POST(request: NextRequest) {
  const { email, teacherId } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceSupabase();

  let query = supabase
    .from('students')
    .select('teacher_id, is_active, privacy_accepted_at')
    .ilike('email', normalizedEmail);

  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }

  const { data, error } = await query;

  // Not found at all
  if (error || !data || data.length === 0) {
    if (teacherId) {
      // Return teacher name so the join page can display it
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
    return NextResponse.json({ error: 'Email not found. Please contact your teacher.' }, { status: 404 });
  }

  const active = data.filter((s: { teacher_id: string; is_active: boolean; privacy_accepted_at: string | null }) => s.is_active);
  if (active.length === 0) {
    return NextResponse.json({ error: 'Your account is inactive. Please contact your teacher.' }, { status: 403 });
  }

  const privacyAccepted = active.some((s: { privacy_accepted_at: string | null }) => s.privacy_accepted_at !== null);

  // Enrich with teacher display names
  const teacherIds = active.map((s: { teacher_id: string }) => s.teacher_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', teacherIds);

  const teachers = (profiles ?? []).map((p: { id: string; display_name: string }) => ({
    id: p.id,
    display_name: p.display_name,
  }));

  // Record login for each teacher this student belongs to
  // Fetch student name from students table
  const { data: studentRow } = await supabase
    .from('students')
    .select('name')
    .ilike('email', normalizedEmail)
    .limit(1)
    .single();

  const logName = studentRow?.name ?? normalizedEmail;
  await supabase.from('student_logins').insert(
    teacherIds.map((tid) => ({
      teacher_id: tid,
      student_email: normalizedEmail,
      student_name: logName,
    }))
  );

  return NextResponse.json({ teachers, privacy_accepted: privacyAccepted });
}
