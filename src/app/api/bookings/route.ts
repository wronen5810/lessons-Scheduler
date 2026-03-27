import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailTeacherNewRequest } from '@/lib/email';
import { formatDate, getEndTime, todayInIsrael } from '@/lib/dates';

// POST /api/bookings — student submits a lesson request
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { booking_type, template_id, one_time_slot_id, date, start_time, student_name, student_email } = body;

  if (!booking_type || (!template_id && !one_time_slot_id) || !date || !start_time || !student_name || !student_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const endTime = getEndTime(start_time);

  // Verify student is on the active list
  const { data: student } = await supabase
    .from('students')
    .select('id, is_active')
    .eq('email', student_email.toLowerCase().trim())
    .single();

  if (!student) {
    return NextResponse.json({ error: 'Your email is not registered. Please contact the teacher.' }, { status: 403 });
  }
  if (!student.is_active) {
    return NextResponse.json({ error: 'Your account is currently inactive. Please contact the teacher.' }, { status: 403 });
  }

  // Verify template exists
  const { data: template } = await supabase
    .from('slot_templates')
    .select('*')
    .eq('id', template_id)
    .single();

  if (!template) {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
  }

  // Check the slot is still available (no pending/approved booking already)
  if (booking_type === 'recurring') {
    const { data: existing } = await supabase
      .from('recurring_bookings')
      .select('id')
      .eq('template_id', template_id)
      .in('status', ['pending', 'approved'])
      .lte('started_date', date)
      .or(`ended_date.is.null,ended_date.gte.${date}`)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 });
    }

    const { data: booking, error } = await supabase
      .from('recurring_bookings')
      .insert({
        template_id,
        student_name,
        student_email,
        started_date: date,
        booked_by: 'student',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    emailTeacherNewRequest({
      studentName: student_name,
      studentEmail: student_email,
      bookingType: 'recurring',
      date,
      dayOfWeek: template.day_of_week,
      startTime: start_time,
      endTime,
    }).catch((e) => console.error('Email failed:', e));

    return NextResponse.json(booking, { status: 201 });
  }

  // one_time booking
  const today = todayInIsrael();
  const maxDate = formatDate(
    new Date(new Date(today).getTime() + 28 * 24 * 60 * 60 * 1000)
  );

  if (date < today || date > maxDate) {
    return NextResponse.json({ error: 'Date out of allowed range' }, { status: 400 });
  }

  const { data: existingOt } = await supabase
    .from('one_time_bookings')
    .select('id')
    .eq('specific_date', date)
    .eq('start_time', start_time)
    .in('status', ['pending', 'approved'])
    .limit(1);

  if (existingOt && existingOt.length > 0) {
    return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 });
  }

  const { data: booking, error } = await supabase
    .from('one_time_bookings')
    .insert({
      template_id: template_id || null,
      one_time_slot_id: one_time_slot_id || null,
      specific_date: date,
      start_time,
      student_name,
      student_email,
      booked_by: 'student',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  emailTeacherNewRequest({
    studentName: student_name,
    studentEmail: student_email,
    bookingType: 'one_time',
    date,
    startTime: start_time,
    endTime,
  }).catch((e) => console.error('Email failed:', e));

  return NextResponse.json(booking, { status: 201 });
}
