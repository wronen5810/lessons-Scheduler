import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? '200'), 500);

  const supabase = createServiceSupabase();

  // ── Student logins ─────────────────────────────────────────────────────────
  const { data: studentLogins } = await supabase
    .from('student_logins')
    .select('student_name, student_email, teacher_id, logged_in_at')
    .order('logged_in_at', { ascending: false })
    .limit(limit);

  // Enrich with student phone from students table
  const studentEmails = [...new Set((studentLogins ?? []).map((l) => l.student_email))];
  let phoneMap: Record<string, string | null> = {};
  if (studentEmails.length > 0) {
    const { data: studentRows } = await supabase
      .from('students')
      .select('email, phone')
      .in('email', studentEmails);
    for (const s of studentRows ?? []) {
      phoneMap[s.email] = s.phone ?? null;
    }
  }

  const students = (studentLogins ?? []).map((l) => ({
    type: 'student' as const,
    name: l.student_name,
    email: l.student_email,
    phone: phoneMap[l.student_email] ?? null,
    logged_in_at: l.logged_in_at,
  }));

  // ── Teacher logins ─────────────────────────────────────────────────────────
  const { data: teacherLogins } = await supabase
    .from('teacher_logins')
    .select('teacher_id, logged_in_at')
    .order('logged_in_at', { ascending: false })
    .limit(limit);

  // Enrich with name, email, phone from profiles + auth
  const teacherIds = [...new Set((teacherLogins ?? []).map((l) => l.teacher_id))];
  let profileMap: Record<string, { name: string; phone: string | null }> = {};
  let emailMapTeacher: Record<string, string> = {};

  if (teacherIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, phone')
      .in('id', teacherIds);
    for (const p of profiles ?? []) {
      profileMap[p.id] = { name: p.display_name, phone: p.phone ?? null };
    }
    // Fetch emails from auth
    const userResults = await Promise.all(
      teacherIds.map((id) => supabase.auth.admin.getUserById(id).then(({ data }) => ({ id, email: data.user?.email ?? '' })))
    );
    for (const u of userResults) emailMapTeacher[u.id] = u.email;
  }

  const teachers = (teacherLogins ?? []).map((l) => ({
    type: 'teacher' as const,
    name: profileMap[l.teacher_id]?.name ?? '',
    email: emailMapTeacher[l.teacher_id] ?? '',
    phone: profileMap[l.teacher_id]?.phone ?? null,
    logged_in_at: l.logged_in_at,
  }));

  // ── Merge and sort ─────────────────────────────────────────────────────────
  const combined = [...students, ...teachers]
    .sort((a, b) => new Date(b.logged_in_at).getTime() - new Date(a.logged_in_at).getTime())
    .slice(0, limit);

  return NextResponse.json(combined);
}
