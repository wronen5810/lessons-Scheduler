import twilio from 'twilio';
import { DAY_NAMES, formatDisplayDateLong } from './dates';

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!.trim(), process.env.TWILIO_AUTH_TOKEN!.trim());
}
function FROM() { return process.env.TWILIO_WHATSAPP_FROM!.trim(); }

interface LessonInfo {
  studentName: string;
  phone: string;
  bookingType: 'recurring' | 'one_time';
  date: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
}

function scheduleText(info: LessonInfo): string {
  if (info.bookingType === 'recurring') {
    return `every ${DAY_NAMES[info.dayOfWeek!]} at ${info.startTime}–${info.endTime} (starting ${formatDisplayDateLong(info.date)})`;
  }
  return `${formatDisplayDateLong(info.date)} at ${info.startTime}–${info.endTime}`;
}

function toWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('0') ? `+972${digits.slice(1)}` : `+${digits}`;
  return `whatsapp:${e164}`;
}

async function sendTemplate(to: string, contentSid: string, variables: Record<string, string>) {
  await getClient().messages.create({
    from: FROM(),
    to: toWhatsApp(to),
    contentSid,
    contentVariables: JSON.stringify(variables),
  });
}

export async function whatsappStudentApproved(info: LessonInfo) {
  await sendTemplate(
    info.phone,
    process.env.TWILIO_TEMPLATE_LESSON_APPROVED!,
    { '1': info.studentName, '2': scheduleText(info) },
  );
}

export async function whatsappStudentRejected(info: LessonInfo) {
  await sendTemplate(
    info.phone,
    process.env.TWILIO_TEMPLATE_LESSON_REJECTED!,
    { '1': info.studentName, '2': scheduleText(info) },
  );
}

export async function whatsappStudentCancelledByTeacher(info: LessonInfo) {
  await sendTemplate(
    info.phone,
    process.env.TWILIO_TEMPLATE_LESSON_CANCELLED!,
    { '1': info.studentName, '2': scheduleText(info) },
  );
}

export async function whatsappStudentReminder(info: LessonInfo & { specificDate: string }) {
  await sendTemplate(
    info.phone,
    process.env.TWILIO_TEMPLATE_LESSON_REMINDER!,
    { '1': info.studentName, '2': formatDisplayDateLong(info.specificDate), '3': `${info.startTime}–${info.endTime}` },
  );
}

interface TeacherRequestInfo {
  teacherPhone: string;
  studentName: string;
  studentEmail: string;
  bookingType: 'recurring' | 'one_time';
  date: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
}

export async function whatsappTeacherNewRequest(info: TeacherRequestInfo) {
  const when = info.bookingType === 'recurring'
    ? `every ${DAY_NAMES[info.dayOfWeek!]} at ${info.startTime}–${info.endTime} (from ${formatDisplayDateLong(info.date)})`
    : `${formatDisplayDateLong(info.date)} at ${info.startTime}–${info.endTime}`;
  await sendTemplate(
    info.teacherPhone,
    process.env.TWILIO_TEMPLATE_LESSON_REQUEST!,
    { '1': info.studentName, '2': info.studentEmail, '3': when },
  );
}

export async function whatsappAdminNewTeacherRequest(info: {
  name: string;
  email: string;
  phone?: string | null;
  comments?: string | null;
}) {
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;
  const templateSid = process.env.TWILIO_TEMPLATE_TEACHER_SUBSCRIPTION;
  if (!adminPhone || !templateSid) return;
  await sendTemplate(
    adminPhone,
    templateSid,
    { '1': info.name, '2': info.email, '3': info.phone ?? 'N/A', '4': info.comments ?? 'N/A' },
  );
}

export async function whatsappTeacherAccessRequest(info: {
  teacherPhone: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
}) {
  const phoneNote = info.studentPhone ? `Phone: ${info.studentPhone}.` : '';
  await sendTemplate(
    info.teacherPhone,
    process.env.TWILIO_TEMPLATE_ACCESS_REQUEST!,
    { '1': info.studentName, '2': info.studentEmail, '3': phoneNote },
  );
}
