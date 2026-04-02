import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailStudentDirectBooking } from '@/lib/email';
import { getEndTime } from '@/lib/dates';

// POST /api/teacher/book — teacher books a slot directly for a student (skips pending)
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { booking_type, template_id, date, start_time, student_name, student_email } = body;

  if (!booking_type || !template_id || !date || !start_time || !student_name || !student_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const endTime = getEndTime(start_time);

  const { data: template } = await supabase
    .from('slot_templates')
    .select('*')
    .eq('id', template_id)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  let booking: Record<string, unknown>;

  if (booking_type === 'recurring') {
    const { data, error } = await supabase
      .from('recurring_bookings')
      .insert({
        template_id,
        student_name,
        student_email,
        started_date: date,
        status: 'approved',
        booked_by: 'teacher',
        teacher_id: auth.user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    booking = data;
  } else {
    const { data, error } = await supabase
      .from('one_time_bookings')
      .insert({
        template_id,
        specific_date: date,
        start_time,
        student_name,
        student_email,
        status: 'approved',
        booked_by: 'teacher',
        teacher_id: auth.user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    booking = data;
  }

  emailStudentDirectBooking({
    studentName: student_name,
    studentEmail: student_email,
    bookingType: booking_type,
    date,
    dayOfWeek: template.day_of_week,
    startTime: start_time,
    endTime,
    cancelToken: booking.cancel_token as string,
  }).catch((e) => console.error('Email failed:', e));

  return NextResponse.json(booking, { status: 201 });
}
