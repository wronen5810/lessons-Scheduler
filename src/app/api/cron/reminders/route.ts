import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailStudentReminder } from '@/lib/email';
import { whatsappStudentReminder } from '@/lib/whatsapp';
import { formatDate, getEndTime, todayInIsrael } from '@/lib/dates';
import { addDays, parseISO } from 'date-fns';
import { DEFAULT_NOTIFICATION_PREFERENCES, sendEmail, sendWhatsApp, type NotificationPreferences } from '@/lib/notifications';

// GET /api/cron/reminders — called daily by Vercel Cron at 06:00 UTC
// Sends reminder emails for all lessons scheduled for tomorrow.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const tomorrow = formatDate(addDays(parseISO(todayInIsrael()), 1));

  // Pre-load all teacher notification prefs and student phones we'll need
  const prefCache = new Map<string, NotificationPreferences>();
  const phoneCache = new Map<string, string | null>(); // key: `${teacherId}:${email}`

  async function getPrefs(teacherId: string): Promise<NotificationPreferences> {
    if (!prefCache.has(teacherId)) {
      const { data } = await supabase.from('teacher_settings').select('notification_preferences').eq('teacher_id', teacherId).single();
      prefCache.set(teacherId, { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(data?.notification_preferences ?? {}) });
    }
    return prefCache.get(teacherId)!;
  }

  async function getPhone(teacherId: string, email: string): Promise<string | null> {
    const cacheKey = `${teacherId}:${email}`;
    if (!phoneCache.has(cacheKey)) {
      const { data } = await supabase.from('students').select('phone').ilike('email', email).eq('teacher_id', teacherId).single();
      phoneCache.set(cacheKey, data?.phone ?? null);
    }
    return phoneCache.get(cacheKey)!;
  }

  // --- One-time bookings with lesson tomorrow ---
  const { data: oneTimeBookings } = await supabase
    .from('one_time_bookings')
    .select('*')
    .eq('specific_date', tomorrow)
    .eq('status', 'approved')
    .eq('reminder_sent', false);

  for (const booking of oneTimeBookings || []) {
    const startTime = booking.start_time?.slice(0, 5) ?? '';
    const prefs = await getPrefs(booking.teacher_id);
    const reminderInfo = {
      studentName: booking.student_name,
      studentEmail: booking.student_email,
      bookingType: 'one_time' as const,
      date: tomorrow,
      specificDate: tomorrow,
      startTime,
      endTime: getEndTime(startTime),
      cancelToken: booking.cancel_token,
    };
    try {
      if (sendEmail(prefs, 'lesson_reminder')) {
        await emailStudentReminder(reminderInfo);
      }
      if (sendWhatsApp(prefs, 'lesson_reminder')) {
        const phone = await getPhone(booking.teacher_id, booking.student_email);
        if (phone) await whatsappStudentReminder({ ...reminderInfo, phone });
      }
      await supabase.from('one_time_bookings').update({ reminder_sent: true }).eq('id', booking.id);
    } catch (err) {
      console.error('Failed to send reminder for one_time booking', booking.id, err);
    }
  }

  // --- Recurring bookings where tomorrow matches the day_of_week ---
  const tomorrowDate = parseISO(tomorrow);
  const tomorrowDow = tomorrowDate.getDay();

  const { data: recurringBookings } = await supabase
    .from('recurring_bookings')
    .select('*, slot_templates(day_of_week, start_time)')
    .eq('status', 'approved')
    .lte('started_date', tomorrow)
    .or(`ended_date.is.null,ended_date.gte.${tomorrow}`);

  for (const booking of recurringBookings || []) {
    const template = booking.slot_templates as { day_of_week: number; start_time: string } | null;
    if (!template || template.day_of_week !== tomorrowDow) continue;

    const { data: existing } = await supabase
      .from('recurring_reminders')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('lesson_date', tomorrow)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const { data: override } = await supabase
      .from('slot_overrides')
      .select('is_blocked')
      .eq('template_id', booking.template_id)
      .eq('specific_date', tomorrow)
      .single();
    if (override?.is_blocked) continue;

    const startTime = template.start_time?.slice(0, 5) ?? '';
    const prefs = await getPrefs(booking.teacher_id);
    const reminderInfo = {
      studentName: booking.student_name,
      studentEmail: booking.student_email,
      bookingType: 'recurring' as const,
      date: booking.started_date,
      specificDate: tomorrow,
      startTime,
      endTime: getEndTime(startTime),
      cancelToken: booking.cancel_token,
    };
    try {
      if (sendEmail(prefs, 'lesson_reminder')) {
        await emailStudentReminder(reminderInfo);
      }
      if (sendWhatsApp(prefs, 'lesson_reminder')) {
        const phone = await getPhone(booking.teacher_id, booking.student_email);
        if (phone) await whatsappStudentReminder({ ...reminderInfo, phone });
      }
      await supabase.from('recurring_reminders').insert({ booking_id: booking.id, lesson_date: tomorrow });
    } catch (err) {
      console.error('Failed to send reminder for recurring booking', booking.id, err);
    }
  }

  return NextResponse.json({ success: true, date: tomorrow });
}
