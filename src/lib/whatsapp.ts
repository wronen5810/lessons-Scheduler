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
  // Ensure E.164 format with whatsapp: prefix
  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('0') ? `+972${digits.slice(1)}` : `+${digits}`;
  return `whatsapp:${e164}`;
}

async function send(to: string, body: string) {
  await getClient().messages.create({ from: FROM(), to: toWhatsApp(to), body });
}

export async function whatsappStudentApproved(info: LessonInfo) {
  await send(
    info.phone,
    `Hi ${info.studentName}! Your lesson has been confirmed: ${scheduleText(info)}. See you then!`,
  );
}

export async function whatsappStudentRejected(info: LessonInfo) {
  await send(
    info.phone,
    `Hi ${info.studentName}, unfortunately your lesson request for ${scheduleText(info)} could not be confirmed at this time. Please contact your teacher to find another time.`,
  );
}

export async function whatsappStudentCancelledByTeacher(info: LessonInfo) {
  await send(
    info.phone,
    `Hi ${info.studentName}, your lesson (${scheduleText(info)}) has been cancelled by your teacher. Please get in touch to reschedule.`,
  );
}

export async function whatsappStudentReminder(info: LessonInfo & { specificDate: string }) {
  await send(
    info.phone,
    `Hi ${info.studentName}, reminder: you have a lesson tomorrow, ${formatDisplayDateLong(info.specificDate)} at ${info.startTime}–${info.endTime}.`,
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
  await send(
    info.teacherPhone,
    `New lesson request from ${info.studentName} (${info.studentEmail}) for ${when}.`,
  );
}

export async function whatsappTeacherAccessRequest(info: {
  teacherPhone: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
}) {
  const phoneNote = info.studentPhone ? ` Phone: ${info.studentPhone}.` : '';
  await send(
    info.teacherPhone,
    `New student access request from ${info.studentName} (${info.studentEmail}).${phoneNote} Check your dashboard to approve.`,
  );
}
