import { addDays, addWeeks, format, parseISO, startOfWeek } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export const TZ = 'Asia/Jerusalem';

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function nowInIsrael(): Date {
  return toZonedTime(new Date(), TZ);
}

export function todayInIsrael(): string {
  return format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd');
}

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 }); // Sunday
}

export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE, MMM d');
}

export function formatDisplayDateLong(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatTimeDisplay(time: string, format: '24h' | '12h' = '24h'): string {
  const t = time.slice(0, 5);
  if (format === '24h') return t;
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getEndTime(startTime: string, durationMinutes = 45): string {
  const [h, m] = startTime.slice(0, 5).split(':').map(Number);
  const total = h * 60 + m + durationMinutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function getMonthStr(dateStr: string): string {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

export function formatMonthDisplay(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  return format(new Date(year, month - 1, 1), 'MMMM yyyy');
}

export function getMonthWeekStarts(monthStr: string): string[] {
  const [year, month] = monthStr.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const weeks: string[] = [];
  let cur = getWeekStart(firstDay);
  while (cur <= lastDay) {
    weeks.push(formatDate(cur));
    cur = addDays(cur, 7);
  }
  return weeks;
}

export function prevMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function addWeeksToDate(dateStr: string, weeks: number): string {
  return formatDate(addWeeks(parseISO(dateStr), weeks));
}

export function maxBookingDate(): string {
  return formatDate(addWeeks(new Date(), 4));
}

/** Returns true if the lesson's cancellation window has already closed (< 24h away) */
export function isCancellationWindowClosed(dateStr: string, startTime: string): boolean {
  const lessonUtc = fromZonedTime(`${dateStr}T${startTime.slice(0, 5)}:00`, TZ);
  const diffMs = lessonUtc.getTime() - Date.now();
  return diffMs < 24 * 60 * 60 * 1000;
}

/** Returns true if the lesson is in the past */
export function isLessonInPast(dateStr: string, startTime: string): boolean {
  const lessonUtc = fromZonedTime(`${dateStr}T${startTime.slice(0, 5)}:00`, TZ);
  return lessonUtc.getTime() < Date.now();
}
