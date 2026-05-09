import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teacher/messages/inbox
// Returns all messages (both directions) for the teacher, joined with student names
export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();

  const { data, error } = await supabase
    .from('messages')
    .select('id, student_email, direction, body, sent_at')
    .eq('teacher_id', auth.user.id)
    .order('sent_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch student names
  const emails = [...new Set((data ?? []).map((m) => m.student_email.toLowerCase()))];
  let nameMap: Record<string, string> = {};
  if (emails.length > 0) {
    const { data: students } = await supabase
      .from('students')
      .select('email, name')
      .eq('teacher_id', auth.user.id)
      .in('email', emails);
    for (const s of students ?? []) {
      nameMap[s.email.toLowerCase()] = s.name;
    }
  }

  const result = (data ?? []).map((m) => ({
    ...m,
    student_name: nameMap[m.student_email.toLowerCase()] ?? m.student_email,
  }));

  return NextResponse.json(result);
}
