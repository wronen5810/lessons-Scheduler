import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { computeWeekSlots } from '@/lib/slots';
import { formatDate, getWeekStart, todayInIsrael } from '@/lib/dates';
import { parseISO } from 'date-fns';

// GET /api/slots?week=YYYY-MM-DD&teacherId=<uuid>&studentEmail=<email>
// Returns slots for the student calendar view. Own bookings are included with their state.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');

  if (!teacherId) {
    return NextResponse.json({ error: 'teacherId is required' }, { status: 400 });
  }

  let weekStr = searchParams.get('week');

  if (!weekStr) {
    const today = todayInIsrael();
    weekStr = formatDate(getWeekStart(parseISO(today)));
  }

  const studentEmail = searchParams.get('studentEmail') ?? undefined;

  const supabase = createServiceSupabase();

  // Resolve which groups this student belongs to (for this teacher)
  let studentGroupIds: Set<string> | undefined;
  if (studentEmail) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('teacher_id', teacherId)
      .ilike('email', studentEmail)
      .single();

    if (student) {
      const { data: memberships } = await supabase
        .from('student_group_members')
        .select('group_id, student_groups!inner(teacher_id)')
        .eq('student_id', student.id);

      studentGroupIds = new Set(
        (memberships ?? [])
          .filter((m) => {
            const g = Array.isArray(m.student_groups) ? m.student_groups[0] : m.student_groups;
            return (g as { teacher_id: string } | null)?.teacher_id === teacherId;
          })
          .map((m) => m.group_id)
      );
    }
  }

  const slots = await computeWeekSlots(weekStr, supabase, false, teacherId, studentEmail, studentGroupIds);

  const studentStates = new Set(['available', 'pending', 'confirmed', 'cancellation_requested', 'completed', 'paid']);
  return NextResponse.json(slots.filter((s) => studentStates.has(s.state)));
}
