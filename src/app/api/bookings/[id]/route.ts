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
import { mergePrefs, sendEmail, sendWhatsApp, sendPush, type NotificationKey } from '@/lib/notifications';
import { sendPushToUser, sendPushToEmails } from '@/lib/firebase-admin';

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

  // For complete/pay on individual (non-group) lessons: handle student_payments
  const isIndividualLesson = !booking.group_id && (action === 'complete' || action === 'pay');
  if (isIndividualLesson) {
    const { data: student } = await supabase
      .from('students')
      .select('id, rate')
      .eq('email', booking.student_email)
      .eq('teacher_id', auth.user.id)
      .single();

    if (student) {
      if (action === 'complete') {
        // Check if there's already a prepaid payment allocated to this specific booking
        const { data: prepaidPayment } = await supabase
          .from('student_payments')
          .select('id')
          .eq('teacher_id', auth.user.id)
          .eq('booking_id', id)
          .maybeSingle();

        if (prepaidPayment) {
          // Prepaid lesson — mark as paid immediately
          updatePayload.status = 'paid';
        } else if (student.rate && student.rate > 0) {
          // Check if there are sufficient unallocated funds to auto-pay this lesson
          const { data: unallocated } = await supabase
            .from('student_payments')
            .select('id, amount')
            .eq('teacher_id', auth.user.id)
            .eq('student_id', student.id)
            .is('booking_id', null)
            .order('paid_at');

          const totalUnallocated = (unallocated ?? []).reduce((s, p) => s + Number(p.amount), 0);

          if (totalUnallocated >= student.rate) {
            // Auto-allocate: record payment for this lesson and mark as paid
            updatePayload.status = 'paid';
            await supabase.from('student_payments').insert({
              teacher_id: auth.user.id,
              student_id: student.id,
              amount: student.rate,
              booking_type: type,
              booking_id: id,
            });

            // Deduct from unallocated payments FIFO
            let remaining = student.rate;
            for (const p of (unallocated ?? [])) {
              if (remaining <= 0) break;
              const pAmount = Number(p.amount);
              if (pAmount <= remaining) {
                await supabase.from('student_payments').delete().eq('id', p.id);
                remaining -= pAmount;
              } else {
                await supabase.from('student_payments').update({ amount: pAmount - remaining }).eq('id', p.id);
                remaining = 0;
              }
            }
          }
        }
      } else if (action === 'pay') {
        // Manual pay: record the payment for this lesson
        await supabase.from('student_payments').insert({
          teacher_id: auth.user.id,
          student_id: student.id,
          amount: student.rate ?? 0,
          booking_type: type,
          booking_id: id,
        });
      }
    }
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

  // Load teacher notification preferences
  const { data: settingsRow } = await supabase
    .from('teacher_settings')
    .select('notification_preferences')
    .eq('teacher_id', auth.user.id)
    .single();

  const prefs = mergePrefs(settingsRow?.notification_preferences);
  const notifKey: NotificationKey =
    action === 'approve' ? 'lesson_approved' :
    action === 'reject'  ? 'lesson_rejected' : 'lesson_cancelled';

  const groupId = (booking.student_email as string)?.startsWith('grp:')
    ? (booking.student_email as string).slice(4)
    : null;

  if (groupId) {
    // Group booking — notify every member
    const { data: members } = await supabase
      .from('student_group_members')
      .select('students!inner(email, phone, name)')
      .eq('group_id', groupId);
    const memberList = (members ?? [])
      .map((m) => {
        const s = (Array.isArray(m.students) ? m.students[0] : m.students) as { email: string; phone: string | null; name: string } | null;
        return { email: s?.email ?? '', phone: s?.phone ?? null, name: s?.name ?? '' };
      })
      .filter((m) => m.email);

    const groupPushTitle =
      action === 'approve' ? 'Group Lesson Confirmed' :
      action === 'reject'  ? 'Group Lesson Declined' : 'Group Lesson Cancelled';
    const groupPushBody =
      action === 'approve' ? `Your group lesson on ${emailInfo.startTime} has been confirmed.` :
      action === 'reject'  ? `Your group lesson on ${emailInfo.startTime} was declined.` :
                             `Your group lesson on ${emailInfo.startTime} has been cancelled.`;

    await Promise.all([
      ...memberList.map((member) =>
        sendEmail(prefs, notifKey)
          ? (action === 'approve'
              ? emailStudentApproved({ ...emailInfo, studentName: member.name, studentEmail: member.email })
              : action === 'reject'
              ? emailStudentRejected({ ...emailInfo, studentName: member.name, studentEmail: member.email })
              : emailStudentCancelledByTeacher({ ...emailInfo, studentName: member.name, studentEmail: member.email })
            ).catch((e) => console.error('Email failed:', e))
          : null
      ),
      ...memberList.filter((m) => m.phone).map((member) =>
        sendWhatsApp(prefs, notifKey)
          ? (action === 'approve'
              ? whatsappStudentApproved({ ...emailInfo, studentName: member.name, phone: member.phone! })
              : action === 'reject'
              ? whatsappStudentRejected({ ...emailInfo, studentName: member.name, phone: member.phone! })
              : whatsappStudentCancelledByTeacher({ ...emailInfo, studentName: member.name, phone: member.phone! })
            ).catch((e) => console.error('WhatsApp failed:', e))
          : null
      ),
      sendPush(prefs, notifKey) && memberList.length > 0
        ? sendPushToEmails(supabase, memberList.map((m) => m.email), groupPushTitle, groupPushBody)
            .catch((e) => console.error('Push failed:', e))
        : null,
    ]);
  } else {
    // Individual booking — notify the student directly
    // Look up phone by email; fall back to student name if no email stored
    let studentPhone: string | null = null;
    if (booking.student_email) {
      const { data: sr } = await supabase.from('students').select('phone').ilike('email', booking.student_email).eq('teacher_id', auth.user.id).maybeSingle();
      studentPhone = sr?.phone ?? null;
    }
    if (!studentPhone && booking.student_name) {
      const { data: sr } = await supabase.from('students').select('phone').ilike('name', booking.student_name).eq('teacher_id', auth.user.id).maybeSingle();
      studentPhone = sr?.phone ?? null;
    }

    const pushTitle =
      action === 'approve' ? 'Lesson Confirmed' :
      action === 'reject'  ? 'Lesson Request Declined' : 'Lesson Cancelled';
    const pushBody =
      action === 'approve' ? `Your lesson on ${emailInfo.startTime} has been confirmed.` :
      action === 'reject'  ? `Your lesson request for ${emailInfo.startTime} was declined.` :
                             `Your lesson on ${emailInfo.startTime} has been cancelled.`;

    await Promise.all([
      sendEmail(prefs, notifKey) && emailInfo.studentEmail ? (
        action === 'approve' ? emailStudentApproved(emailInfo) :
        action === 'reject'  ? emailStudentRejected(emailInfo) :
                               emailStudentCancelledByTeacher(emailInfo)
      ).catch((e) => console.error('Email failed:', e)) : null,
      sendWhatsApp(prefs, notifKey) && studentPhone ? (async () => {
        const waInfo = { ...emailInfo, phone: studentPhone };
        return (
          action === 'approve' ? whatsappStudentApproved(waInfo) :
          action === 'reject'  ? whatsappStudentRejected(waInfo) :
                                 whatsappStudentCancelledByTeacher(waInfo)
        ).catch((e) => console.error('WhatsApp failed:', e));
      })() : null,
      sendPush(prefs, notifKey) ? sendPushToUser(supabase, auth.user.id, pushTitle, pushBody).catch((e) => console.error('Push failed:', e)) : null,
    ]);
  }

  return NextResponse.json({ success: true });
}
