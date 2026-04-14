import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export interface GroupPaymentRecord {
  id: string;
  booking_type: string;
  booking_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  paid_at: string;
}

// GET /api/teacher/group-payments?booking_type=...&booking_id=...
export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const booking_type = searchParams.get('booking_type');
  const booking_id = searchParams.get('booking_id');

  if (!booking_type || !booking_id) {
    return NextResponse.json({ error: 'booking_type and booking_id are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('group_booking_payments')
    .select('id, booking_type, booking_id, student_id, paid_at, students(name, email)')
    .eq('teacher_id', auth.user.id)
    .eq('booking_type', booking_type)
    .eq('booking_id', booking_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: GroupPaymentRecord[] = (data ?? []).map((p) => {
    const s = (Array.isArray(p.students) ? p.students[0] : p.students) as { name: string; email: string } | null;
    return {
      id: p.id,
      booking_type: p.booking_type,
      booking_id: p.booking_id,
      student_id: p.student_id,
      student_name: s?.name ?? '',
      student_email: s?.email ?? '',
      paid_at: p.paid_at,
    };
  });

  return NextResponse.json(result);
}

// POST /api/teacher/group-payments — mark a student as paid for a group lesson
// Auto-transitions booking to 'paid' when all group members have paid
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { booking_type, booking_id, student_id } = await request.json();
  if (!booking_type || !booking_id || !student_id) {
    return NextResponse.json({ error: 'booking_type, booking_id and student_id are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const teacherId = auth.user.id;
  const table = booking_type === 'recurring' ? 'recurring_bookings' : 'one_time_bookings';

  // Verify booking exists and belongs to this teacher
  const { data: booking } = await supabase
    .from(table)
    .select('id, group_id, status')
    .eq('id', booking_id)
    .eq('teacher_id', teacherId)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (!booking.group_id) return NextResponse.json({ error: 'Not a group booking' }, { status: 400 });
  if (!['completed', 'paid'].includes(booking.status)) {
    return NextResponse.json({ error: 'Lesson must be completed before recording payment' }, { status: 400 });
  }

  // Record the payment
  const { data: payment, error: payError } = await supabase
    .from('group_booking_payments')
    .insert({ booking_type, booking_id, student_id, teacher_id: teacherId })
    .select()
    .single();

  if (payError) {
    if (payError.code === '23505') {
      return NextResponse.json({ error: 'This student has already paid for this lesson' }, { status: 409 });
    }
    return NextResponse.json({ error: payError.message }, { status: 500 });
  }

  // Check if all group members have now paid
  const [{ data: members }, { data: payments }] = await Promise.all([
    supabase
      .from('student_group_members')
      .select('student_id')
      .eq('group_id', booking.group_id),
    supabase
      .from('group_booking_payments')
      .select('student_id')
      .eq('booking_type', booking_type)
      .eq('booking_id', booking_id)
      .eq('teacher_id', teacherId),
  ]);

  const memberIds = new Set((members ?? []).map((m) => m.student_id));
  const paidIds = new Set((payments ?? []).map((p) => p.student_id));
  const allPaid = memberIds.size > 0 && [...memberIds].every((id) => paidIds.has(id));

  if (allPaid) {
    await supabase.from(table).update({ status: 'paid' }).eq('id', booking_id);
  }

  return NextResponse.json({ payment, all_paid: allPaid }, { status: 201 });
}
