import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { formatTime, getEndTime } from '@/lib/dates';

export interface StudentNote {
  note_id: string;
  note: string;
  visible_to_student: boolean;
  created_at: string;
  booking_type: 'one_time' | 'recurring';
  booking_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

// GET /api/teacher/students/[id]/notes
// Returns all notes for all bookings belonging to a student (matched by email).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();
  const teacherId = auth.user.id;

  // Get student email
  const { data: student } = await supabase
    .from('students')
    .select('email')
    .eq('id', id)
    .eq('teacher_id', teacherId)
    .single();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  const email = student.email.toLowerCase();

  // Get all booking IDs for this student
  const [{ data: otBookings }, { data: recBookings }] = await Promise.all([
    supabase
      .from('one_time_bookings')
      .select('id, specific_date, start_time, duration_minutes')
      .eq('teacher_id', teacherId)
      .ilike('student_email', email),
    supabase
      .from('recurring_bookings')
      .select('id, lesson_date, template_id')
      .eq('teacher_id', teacherId)
      .ilike('student_email', email),
  ]);

  const otIds = (otBookings ?? []).map((b) => b.id);
  const recIds = (recBookings ?? []).map((b) => b.id);
  const allIds = [...otIds, ...recIds];

  if (!allIds.length) return NextResponse.json([]);

  // Fetch all notes for these bookings
  const { data: notes } = await supabase
    .from('booking_notes')
    .select('*')
    .eq('teacher_id', teacherId)
    .in('booking_id', allIds)
    .order('created_at', { ascending: false });

  if (!notes?.length) return NextResponse.json([]);

  // Fetch templates for recurring
  const templateIds = [...new Set((recBookings ?? []).map((b) => b.template_id))];
  const { data: templates } = templateIds.length
    ? await supabase.from('slot_templates').select('id, start_time, duration_minutes').in('id', templateIds)
    : { data: [] };
  const tplMap = new Map((templates ?? []).map((t) => [t.id, t]));

  // Build lookup maps
  const otMap = new Map((otBookings ?? []).map((b) => [b.id, b]));
  const recMap = new Map((recBookings ?? []).map((b) => [b.id, b]));

  const result: StudentNote[] = notes.map((n) => {
    let date = '', start_time = '', end_time = '';
    if (n.booking_type === 'one_time') {
      const b = otMap.get(n.booking_id);
      if (b) {
        date = b.specific_date;
        start_time = formatTime(b.start_time);
        end_time = getEndTime(start_time, b.duration_minutes ?? 45);
      }
    } else {
      const b = recMap.get(n.booking_id);
      if (b) {
        const tpl = tplMap.get(b.template_id);
        date = b.lesson_date;
        start_time = tpl ? formatTime(tpl.start_time) : '';
        end_time = getEndTime(start_time, tpl?.duration_minutes ?? 45);
      }
    }
    return {
      note_id: n.id,
      note: n.note,
      visible_to_student: n.visible_to_student,
      created_at: n.created_at,
      booking_type: n.booking_type,
      booking_id: n.booking_id,
      date,
      start_time,
      end_time,
    };
  });

  return NextResponse.json(result);
}
