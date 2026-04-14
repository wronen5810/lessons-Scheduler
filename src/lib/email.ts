import { Resend } from 'resend';
import { DAY_NAMES, formatDisplayDateLong } from './dates';

function getResend() { return new Resend(process.env.RESEND_API_KEY!); }
function FROM() { return process.env.EMAIL_FROM!; }
function TEACHER_EMAIL() { return process.env.TEACHER_EMAIL!; }
function BASE_URL() { return process.env.NEXT_PUBLIC_BASE_URL!; }

interface LessonInfo {
  studentName: string;
  studentEmail: string;
  bookingType: 'recurring' | 'one_time';
  date: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  cancelToken?: string;
  reason?: string;
  teacherEmail?: string;
}

function scheduleText(info: LessonInfo): string {
  if (info.bookingType === 'recurring') {
    return `Every <strong>${DAY_NAMES[info.dayOfWeek!]}</strong> at ${info.startTime}–${info.endTime} (starting ${formatDisplayDateLong(info.date)})`;
  }
  return `<strong>${formatDisplayDateLong(info.date)}</strong> at ${info.startTime}–${info.endTime}`;
}

function cancelLink(token: string): string {
  return `<p style="margin-top:16px;font-size:13px;color:#666;">Need to cancel? You can do so up to 24 hours before the lesson:<br/>
  <a href="${BASE_URL()}/cancel/${token}">Cancel this lesson →</a></p>`;
}

export async function emailTeacherNewRequest(info: LessonInfo) {
  await getResend().emails.send({
    from: FROM(),
    to: info.teacherEmail ?? TEACHER_EMAIL(),
    subject: `New lesson request from ${info.studentName}`,
    html: `
      <h2>New Lesson Request</h2>
      <p><strong>Student:</strong> ${info.studentName} (${info.studentEmail})</p>
      <p><strong>Schedule:</strong> ${scheduleText(info)}</p>
      <p><a href="${BASE_URL()}/teacher">View in dashboard →</a></p>
    `,
  });
}

export async function emailStudentApproved(info: LessonInfo & { cancelToken: string }) {
  await getResend().emails.send({
    from: FROM(),
    to: info.studentEmail,
    subject: 'Your lesson is confirmed!',
    html: `
      <h2>Lesson Confirmed</h2>
      <p>Hi ${info.studentName},</p>
      <p>Your lesson request has been approved.</p>
      <p><strong>Schedule:</strong> ${scheduleText(info)}</p>
      ${cancelLink(info.cancelToken)}
    `,
  });
}

export async function emailStudentRejected(info: LessonInfo) {
  await getResend().emails.send({
    from: FROM(),
    to: info.studentEmail,
    subject: 'Lesson request update',
    html: `
      <h2>Lesson Request Update</h2>
      <p>Hi ${info.studentName},</p>
      <p>Unfortunately your lesson request for ${scheduleText(info)} could not be confirmed at this time.</p>
      <p><a href="${BASE_URL()}">View available times →</a></p>
    `,
  });
}

export async function emailStudentDirectBooking(info: LessonInfo & { cancelToken: string }) {
  await getResend().emails.send({
    from: FROM(),
    to: info.studentEmail,
    subject: 'A lesson has been scheduled for you',
    html: `
      <h2>Lesson Scheduled</h2>
      <p>Hi ${info.studentName},</p>
      <p>A lesson has been scheduled for you.</p>
      <p><strong>Schedule:</strong> ${scheduleText(info)}</p>
      ${cancelLink(info.cancelToken)}
    `,
  });
}

export async function emailStudentReminder(
  info: LessonInfo & { cancelToken: string; specificDate: string }
) {
  await getResend().emails.send({
    from: FROM(),
    to: info.studentEmail,
    subject: `Reminder: Lesson tomorrow at ${info.startTime}`,
    html: `
      <h2>Lesson Reminder</h2>
      <p>Hi ${info.studentName},</p>
      <p>Just a reminder that you have a lesson tomorrow:</p>
      <p><strong>${formatDisplayDateLong(info.specificDate)} at ${info.startTime}–${info.endTime}</strong></p>
      ${cancelLink(info.cancelToken)}
    `,
  });
}

export async function emailTeacherCancellation(info: LessonInfo & { reason: string }) {
  await getResend().emails.send({
    from: FROM(),
    to: info.teacherEmail ?? TEACHER_EMAIL(),
    subject: `Lesson cancellation from ${info.studentName}`,
    html: `
      <h2>Lesson Cancelled by Student</h2>
      <p><strong>Student:</strong> ${info.studentName} (${info.studentEmail})</p>
      <p><strong>Lesson:</strong> ${scheduleText(info)}</p>
      <p><strong>Reason:</strong> ${info.reason || 'No reason provided'}</p>
    `,
  });
}

export async function emailTeacherAccessRequest({
  studentName,
  studentEmail,
  studentPhone,
  studentNote,
  teacherEmail,
}: {
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
  studentNote?: string | null;
  teacherEmail: string;
}) {
  await getResend().emails.send({
    from: FROM(),
    to: teacherEmail,
    subject: `Access request from ${studentName}`,
    html: `
      <h2>New Student Access Request</h2>
      <p>A student tried to log in using your link but is not in your student list yet.</p>
      <p><strong>Name:</strong> ${studentName}</p>
      <p><strong>Email:</strong> ${studentEmail}</p>
      ${studentPhone ? `<p><strong>Phone:</strong> ${studentPhone}</p>` : ''}
      ${studentNote ? `<p><strong>Note:</strong> ${studentNote}</p>` : ''}
      <p>Log in to your dashboard to add them as a student:</p>
      <p><a href="${BASE_URL()}/teacher">Go to dashboard →</a></p>
    `,
  });
}

export async function emailStudentCancelledByTeacher(info: LessonInfo) {
  await getResend().emails.send({
    from: FROM(),
    to: info.studentEmail,
    subject: 'Your lesson has been cancelled',
    html: `
      <h2>Lesson Cancelled</h2>
      <p>Hi ${info.studentName},</p>
      <p>Your lesson (${scheduleText(info)}) has been cancelled by the teacher.</p>
      <p><a href="${BASE_URL()}">Book a new time →</a></p>
    `,
  });
}

export async function emailDirectMessage({
  to,
  studentName,
  message,
  teacherEmail,
}: {
  to: string;
  studentName: string;
  message: string;
  teacherEmail: string;
}) {
  await getResend().emails.send({
    from: FROM(),
    to,
    reply_to: teacherEmail,
    subject: 'Message from your teacher',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
        <p>Hi ${studentName},</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <p style="font-size:12px;color:#888">To reply, just respond to this email.</p>
      </div>
    `,
  });
}
