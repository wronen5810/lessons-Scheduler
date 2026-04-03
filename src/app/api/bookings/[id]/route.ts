import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import {
  emailStudentApproved,
  emailStudentCancelledByTeacher,
  emailStudentRejected,
} from '@/lib/email';
import { getEndTime } from '@/lib/dates';

// PATCH /api/bookings/[id]?type=recurring|one_time&action=approve|reject|cancel|complete|pay|approve-cancellation
// For recurring with a series_id, approve/reject/cancel acts on all rows in the series.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'recurring' | 'one_time';
  const action = searchParams.get('action') as 'approve' | 'reject' | 'cancel' | 'complete' | 'pay' | 'approve-cancellation';
  const endDate = searchParams.get('end_date') ?? undefined;

  if (!type || !action) {
    return NextResponse.json({ error: 'Missing type or action' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const table = type === 'recurring' ? 'recurring_bookings' : 'one_time_bookings';

  const { data: booking } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const newStatus =
    action === 'approve'              ? 'approved'  :
    action === 'reject'               ? 'rejected'  :
    action === 'cancel'               ? 'cancelled' :
    action === 'approve-cancellation' ? 'cancelled' :
    action === 'complete'             ? 'completed' :
    action === 'pay'                  ? 'paid'      : 'cancelled';

  const updatePayload: Record<string, unknown> = { status: newStatus };
  if (action === 'cancel' || action === 'approve-cancellation') {
    updatePayload.cancelled_at = new Date().toISOString();
    updatePayload.cancelled_by = action === 'approve-cancellation' ? 'student' : 'teacher';
  }

  if (type === 'recurring' && booking.series_id && ['approve', 'reject', 'cancel', 'approve-cancellation'].includes(action)) {
    let query = supabase
      .from('recurring_bookings')
      .update(updatePayload)
      .eq('series_id', booking.series_id)
      .eq('teacher_id', auth.user.id);
    if (action === 'cancel' && endDate) {
      query = query.gte('lesson_date', endDate);
    }
    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from(table).update(updatePayload).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build email info
  let startTime: string;
  let date: string;
  let dayOfWeek: number | undefined;

  if (type === 'recurring') {
    const { data: template } = await supabase
      .from('slot_templates')
      .select('day_of_week, start_time')
      .eq('id', booking.template_id)
      .single();
    dayOfWeek = template?.day_of_week;
    startTime = template?.start_time?.slice(0, 5) ?? '';
    date = booking.lesson_date ?? booking.started_date;
  } else {
    startTime = booking.start_time?.slice(0, 5) ?? '';
    date = booking.specific_date;
  }

  const endTime = getEndTime(startTime);
  const emailInfo = {
    studentName: booking.student_name,
    studentEmail: booking.student_email,
    bookingType: type,
    date,
    dayOfWeek,
    startTime,
    endTime,
    cancelToken: booking.cancel_token,
  };

  const sendEmail =
    action === 'approve' ? emailStudentApproved(emailInfo) :
    action === 'reject'  ? emailStudentRejected(emailInfo) :
                           emailStudentCancelledByTeacher(emailInfo);
  sendEmail.catch((e) => console.error('Email failed:', e));

  return NextResponse.json({ success: true });
}
