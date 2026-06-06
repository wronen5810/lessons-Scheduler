import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/teacher/messages/read
// Body: { student_email: string }
// Marks all to_teacher messages from that student as read (sets read_at = now())
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { student_email } = await request.json() as { student_email?: string };
  if (!student_email) {
    return NextResponse.json({ error: 'student_email required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('teacher_id', auth.user.id)
    .ilike('student_email', student_email)
    .eq('direction', 'to_teacher')
    .is('read_at', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
