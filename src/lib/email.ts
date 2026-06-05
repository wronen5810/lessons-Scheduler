import { Resend } from 'resend';
import { DAY_NAMES, formatDisplayDateLong } from './dates';

function getResend() { return new Resend(process.env.RESEND_API_KEY!); }
function FROM() { return process.env.EMAIL_FROM!; }
function TEACHER_EMAIL() { return process.env.TEACHER_EMAIL!; }
function BASE_URL() { return process.env.NEXT_PUBLIC_BASE_URL!.trim(); }

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

export async function emailTeacherStudentAutoApproved({
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
    subject: `New student joined: ${studentName}`,
    html: `
      <h2>New Student Joined</h2>
      <p>A student has been automatically added to your student list.</p>
      <p><strong>Name:</strong> ${studentName}</p>
      <p><strong>Email:</strong> ${studentEmail}</p>
      ${studentPhone ? `<p><strong>Phone:</strong> ${studentPhone}</p>` : ''}
      ${studentNote ? `<p><strong>Note:</strong> ${studentNote}</p>` : ''}
      <p><a href="${BASE_URL()}/teacher/students">View your students →</a></p>
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

export async function emailTeacherPasswordReset({
  teacherName,
  teacherEmail,
  resetLink,
}: {
  teacherName: string;
  teacherEmail: string;
  resetLink: string;
}) {
  await getResend().emails.send({
    from: FROM(),
    reply_to: 'info@saderot.com',
    to: teacherEmail,
    subject: 'Reset your Saderot password',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;padding:24px">
        <h1 style="font-size:20px;font-weight:700;margin:0 0 16px">Reset your password</h1>
        <p>Hi ${teacherName},</p>
        <p>We received a request to reset the password for your Saderot account.</p>
        <p>Click the button below to choose a new password. This link is valid for <strong>2 hours</strong>.</p>
        <p style="margin:28px 0">
          <a href="${resetLink}"
             style="background:#2563EB;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
            Reset password →
          </a>
        </p>
        <p style="font-size:13px;color:#888">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px"/>
        <p style="font-size:12px;color:#aaa;margin:0">Saderot · <a href="${BASE_URL()}" style="color:#aaa">${BASE_URL()}</a></p>
      </div>
    `,
  });
}

export async function emailTeacherWelcome({
  teacherName,
  teacherEmail,
  setPasswordLink,
}: {
  teacherName: string;
  teacherEmail: string;
  setPasswordLink: string;
}) {
  await getResend().emails.send({
    from: FROM(),
    reply_to: 'info@saderot.com',
    to: teacherEmail,
    subject: 'Welcome to Saderot — set your password to get started',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;padding:24px">
        <h1 style="font-size:24px;font-weight:700;margin:0 0 4px">Welcome to Saderot!</h1>
        <p style="color:#555;margin:0 0 20px">Your scheduling platform for private teachers.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px"/>
        <p>Hi ${teacherName},</p>
        <p>Great news — your subscription has been approved! 🎉</p>
        <p>You can now manage your students, schedule lessons, and share your personal booking link with students.</p>
        <p>To get started, set your password by clicking the button below:</p>
        <p style="margin:28px 0">
          <a href="${setPasswordLink}"
             style="background:#2563EB;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
            Set my password →
          </a>
        </p>
        <p>Once you're in, check out the <a href="https://saderot.com/guide" style="color:#2563EB;font-weight:600">User Guide</a> to get up to speed quickly.</p>
        <p style="font-size:13px;color:#888">This link expires in 24 hours. If you have any questions, reply to this email and we'll be happy to help.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px"/>
        <p style="font-size:12px;color:#aaa;margin:0">Saderot · Lesson Scheduling for Teachers · <a href="${BASE_URL()}" style="color:#aaa">${BASE_URL()}</a></p>
      </div>
    `,
  });
}

export async function emailSubscribeInvite({ email }: { email: string }) {
  const link = `${BASE_URL()}/subscribe?email=${encodeURIComponent(email)}`;
  return getResend().emails.send({
    from: FROM(),
    to: email,
    subject: 'Complete your Saderot registration',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
        <h2 style="color:#1e293b;margin-bottom:8px">You're almost there!</h2>
        <p>Thanks for your interest in Saderot — lesson scheduling built for teachers.</p>
        <p>Click the button below to choose your plan and complete your registration:</p>
        <p style="margin:28px 0">
          <a href="${link}"
             style="background:#2563EB;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
            Complete registration →
          </a>
        </p>
        <p style="font-size:13px;color:#888">Or copy this link: <a href="${link}" style="color:#2563EB">${link}</a></p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px"/>
        <p style="font-size:12px;color:#aaa;margin:0">Saderot · Lesson Scheduling for Teachers · <a href="${BASE_URL()}" style="color:#aaa">${BASE_URL()}</a></p>
      </div>
    `,
  });
}

export async function emailEventReminder({
  studentName,
  studentEmail,
  eventType,
  description,
  eventDate,
  eventTime,
}: {
  studentName: string;
  studentEmail: string;
  eventType: string;
  description: string;
  eventDate: string;
  eventTime: string | null;
}) {
  const timeStr = eventTime ? ` at ${eventTime.slice(0, 5)}` : '';
  await getResend().emails.send({
    from: FROM(),
    to: studentEmail,
    subject: `Reminder: ${eventType} on ${formatDisplayDateLong(eventDate)}`,
    html: `
      <h2>Event Reminder</h2>
      <p>Hi ${studentName},</p>
      <p>Just a reminder about an upcoming event:</p>
      <p><strong>${formatDisplayDateLong(eventDate)}${timeStr}</strong></p>
      <p><strong>${eventType}:</strong> ${description}</p>
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
