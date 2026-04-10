import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import {
  emailStudentApproved,
  emailStudentCancelledByTeacher,
  emailStudentRejected,
} from '@/lib/email';
import {
  whatsappStudentApproved,
  whatsappStudentCancelledByTeacher,
  whatsappStudentRejected,
} from '@/lib/whatsapp';
import { getEndTime } from '@/lib/dates';
import { DEFAULT_NOTIFICATION_PREFERENCES, sendEmail, sendWhatsApp, type NotificationKey } from '@/lib/notifications';

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

  // approve-cancellation always affects only the single booking (slot reverts to available)
  if (type === 'recurring' && booking.series_id && ['approve', 'reject', 'cancel'].includes(action)) {
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

  // Load teacher notification preferences and student phone in parallel
  const [{ data: settingsRow }, { data: studentRow }] = await Promise.all([
    supabase.from('teacher_settings').select('notification_preferences').eq('teacher_id', auth.user.id).single(),
    supabase.from('students').select('phone').ilike('email', booking.student_email).eq('teacher_id', auth.user.id).single(),
  ]);

  const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(settingsRow?.notification_preferences ?? {}) };
  const notifKey: NotificationKey =
    action === 'approve' ? 'lesson_approved' :
    action === 'reject'  ? 'lesson_rejected' : 'lesson_cancelled';

  await Promise.all([
    sendEmail(prefs, notifKey) ? (
      action === 'approve' ? emailStudentApproved(emailInfo) :
      action === 'reject'  ? emailStudentRejected(emailInfo) :
                             emailStudentCancelledByTeacher(emailInfo)
    ).catch((e) => console.error('Email failed:', e)) : null,
    sendWhatsApp(prefs, notifKey) && studentRow?.phone ? (() => {
      const waInfo = { ...emailInfo, phone: studentRow.phone };
      return (
        action === 'approve' ? whatsappStudentApproved(waInfo) :
        action === 'reject'  ? whatsappStudentRejected(waInfo) :
                               whatsappStudentCancelledByTeacher(waInfo)
      ).catch((e) => console.error('WhatsApp failed:', e));
    })() : null,
  ]);

  return NextResponse.json({ success: true });
}
