import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailStudentReminder, emailEventReminder } from '@/lib/email';
import { whatsappStudentReminder, whatsappEventReminder } from '@/lib/whatsapp';
import { formatDate, getEndTime, todayInIsrael } from '@/lib/dates';
import { addDays, parseISO } from 'date-fns';
import { mergePrefs, sendEmail, sendWhatsApp, type NotificationPreferences } from '@/lib/notifications';

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
      prefCache.set(teacherId, mergePrefs(data?.notification_preferences));
    }
    return prefCache.get(teacherId)!;
  }

  async function getPhone(teacherId: string, email: string, name?: string): Promise<string | null> {
    const cacheKey = `${teacherId}:${email || name || ''}`;
    if (!phoneCache.has(cacheKey)) {
      let phone: string | null = null;
      if (email) {
        const { data } = await supabase.from('students').select('phone').ilike('email', email).eq('teacher_id', teacherId).maybeSingle();
        phone = data?.phone ?? null;
      }
      if (!phone && name) {
        const { data } = await supabase.from('students').select('phone').ilike('name', name).eq('teacher_id', teacherId).maybeSingle();
        phone = data?.phone ?? null;
      }
      phoneCache.set(cacheKey, phone);
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
      if (sendEmail(prefs, 'lesson_reminder') && booking.student_email) {
        await emailStudentReminder(reminderInfo);
      }
      if (sendWhatsApp(prefs, 'lesson_reminder')) {
        const phone = await getPhone(booking.teacher_id, booking.student_email, booking.student_name);
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
      if (sendEmail(prefs, 'lesson_reminder') && booking.student_email) {
        await emailStudentReminder(reminderInfo);
      }
      if (sendWhatsApp(prefs, 'lesson_reminder')) {
        const phone = await getPhone(booking.teacher_id, booking.student_email, booking.student_name);
        if (phone) await whatsappStudentReminder({ ...reminderInfo, phone });
      }
      await supabase.from('recurring_reminders').insert({ booking_id: booking.id, lesson_date: tomorrow });
    } catch (err) {
      console.error('Failed to send reminder for recurring booking', booking.id, err);
    }
  }

  // --- Calendar event reminders ---
  const today = todayInIsrael();

  const { data: dueEvents } = await supabase
    .from('calendar_events')
    .select('*, calendar_event_students(student_id, students(id, name, email, phone))')
    .eq('reminder_sent', false)
    .not('reminder_days', 'is', null);

  for (const event of dueEvents ?? []) {
    const eventDay = formatDate(addDays(parseISO(today), event.reminder_days as number));
    if (eventDay !== event.event_date) continue;

    const channels = (event.reminder_channels as { email: boolean; whatsapp: boolean } | null) ?? { email: true, whatsapp: false };
    const eventTypeLabel = (event.event_type as string).charAt(0).toUpperCase() + (event.event_type as string).slice(1);

    // Build recipient list from calendar_event_students + student_id (for student-created events)
    type StudentRow = { id: string; name: string; email: string; phone?: string | null };
    const recipients: StudentRow[] = [];
    const seen = new Set<string>();

    for (const es of (event.calendar_event_students as Array<{ student_id: string; students: StudentRow }>) ?? []) {
      if (es.students && !seen.has(es.student_id)) {
        seen.add(es.student_id);
        recipients.push(es.students);
      }
    }

    // If student-created event, also notify that student
    if (event.student_id && !seen.has(event.student_id)) {
      const { data: stu } = await supabase.from('students').select('id, name, email, phone').eq('id', event.student_id).maybeSingle();
      if (stu) recipients.push(stu);
    }

    try {
      for (const recipient of recipients) {
        if (channels.email && recipient.email) {
          await emailEventReminder({
            studentName: recipient.name,
            studentEmail: recipient.email,
            eventType: eventTypeLabel,
            description: event.description as string,
            eventDate: event.event_date as string,
            eventTime: event.event_time as string | null,
          });
        }
        if (channels.whatsapp) {
          const phone = recipient.phone ?? await getPhone(event.teacher_id as string, recipient.email, recipient.name);
          if (phone) {
            await whatsappEventReminder({
              phone,
              studentName: recipient.name,
              eventType: eventTypeLabel,
              description: event.description as string,
              eventDate: event.event_date as string,
              eventTime: event.event_time as string | null,
            });
          }
        }
      }
      await supabase.from('calendar_events').update({ reminder_sent: true }).eq('id', event.id);
    } catch (err) {
      console.error('Failed to send reminder for calendar event', event.id, err);
    }
  }

  return NextResponse.json({ success: true, date: tomorrow });
}
