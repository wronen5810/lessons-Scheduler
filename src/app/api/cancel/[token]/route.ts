import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailTeacherCancellation } from '@/lib/email';
import { getEndTime, isCancellationWindowClosed, isLessonInPast } from '@/lib/dates';
import { DAY_NAMES } from '@/lib/dates';

async function findBookingByToken(supabase: ReturnType<typeof createServiceSupabase>, token: string) {
  const [{ data: recurring }, { data: oneTime }] = await Promise.all([
    supabase.from('recurring_bookings').select('*').eq('cancel_token', token).single(),
    supabase.from('one_time_bookings').select('*').eq('cancel_token', token).single(),
  ]);
  if (recurring) return { booking: recurring, type: 'recurring' as const };
  if (oneTime) return { booking: oneTime, type: 'one_time' as const };
  return null;
}

// GET /api/cancel/[token] — fetch booking info for cancellation page
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServiceSupabase();
  const result = await findBookingByToken(supabase, token);

  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { booking, type } = result;

  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Already cancelled' }, { status: 410 });
  }
  if (booking.status !== 'approved') {
    return NextResponse.json({ error: 'Booking is not confirmed' }, { status: 400 });
  }

  let date: string;
  let startTime: string;
  let dayOfWeek: number | undefined;

  if (type === 'recurring') {
    const { data: template } = await supabase
      .from('slot_templates')
      .select('day_of_week, start_time')
      .eq('id', booking.template_id)
      .single();
    date = booking.started_date;
    startTime = template?.start_time?.slice(0, 5) ?? '';
    dayOfWeek = template?.day_of_week;
  } else {
    date = booking.specific_date;
    startTime = booking.start_time?.slice(0, 5) ?? '';
  }

  // For recurring: use next upcoming lesson date instead of started_date
  let lessonDate = date;
  if (type === 'recurring') {
    const today = new Date().toISOString().slice(0, 10);
    // Find the next occurrence from today
    const { formatDate, getWeekStart, getWeekDates, todayInIsrael } = await import('@/lib/dates');
    const { addWeeks, parseISO } = await import('date-fns');
    const todayStr = todayInIsrael();
    let checkDate = parseISO(todayStr);
    for (let i = 0; i < 8; i++) {
      const weekDates = getWeekDates(getWeekStart(checkDate));
      for (const d of weekDates) {
        const dStr = formatDate(d);
        if (dStr >= todayStr && d.getDay() === dayOfWeek) {
          lessonDate = dStr;
          break;
        }
      }
      if (lessonDate !== date) break;
      checkDate = addWeeks(checkDate, 1);
    }
  }

  const windowClosed = isCancellationWindowClosed(lessonDate, startTime);
  const inPast = isLessonInPast(lessonDate, startTime);

  return NextResponse.json({
    booking_type: type,
    student_name: booking.student_name,
    date: lessonDate,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: getEndTime(startTime),
    cancellation_window_closed: windowClosed || inPast,
  });
}

// POST /api/cancel/[token] — student submits cancellation
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json();
  const { reason } = body;

  const supabase = createServiceSupabase();
  const result = await findBookingByToken(supabase, token);

  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { booking, type } = result;

  if (booking.status !== 'approved') {
    return NextResponse.json({ error: 'Booking is not confirmed' }, { status: 400 });
  }

  let date: string;
  let startTime: string;
  let dayOfWeek: number | undefined;

  if (type === 'recurring') {
    const { data: template } = await supabase
      .from('slot_templates')
      .select('day_of_week, start_time')
      .eq('id', booking.template_id)
      .single();
    date = booking.started_date;
    startTime = template?.start_time?.slice(0, 5) ?? '';
    dayOfWeek = template?.day_of_week;
  } else {
    date = booking.specific_date;
    startTime = booking.start_time?.slice(0, 5) ?? '';
  }

  if (isCancellationWindowClosed(date, startTime)) {
    return NextResponse.json({ error: 'Cancellation window has passed' }, { status: 400 });
  }

  const table = type === 'recurring' ? 'recurring_bookings' : 'one_time_bookings';
  await supabase.from(table).update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_by: 'student',
    cancellation_reason: reason || null,
  }).eq('id', booking.id);

  await emailTeacherCancellation({
    studentName: booking.student_name,
    studentEmail: booking.student_email,
    bookingType: type,
    date,
    dayOfWeek,
    startTime,
    endTime: getEndTime(startTime),
    reason: reason || '',
  });

  return NextResponse.json({ success: true });
}
