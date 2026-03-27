import { addDays, parseISO } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatDate, formatTime, getEndTime, getWeekDates } from './dates';
import type {
  ComputedSlot,
  OneTimeBooking,
  OneTimeSlot,
  RecurringBooking,
  SlotOverride,
  SlotTemplate,
} from './types';

function bookingToState(status: string): import('./types').SlotState {
  if (status === 'approved') return 'confirmed';
  if (status === 'completed') return 'completed';
  if (status === 'paid') return 'paid';
  return 'pending';
}

export async function computeWeekSlots(
  weekStartStr: string,
  supabase: SupabaseClient,
  forTeacher = false
): Promise<ComputedSlot[]> {
  const weekStart = parseISO(weekStartStr);
  const weekDates = getWeekDates(weekStart);
  const weekEndStr = formatDate(addDays(weekStart, 6));

  const [
    { data: templates },
    { data: overrides },
    { data: recurring },
    { data: oneTimeBookings },
    { data: oneTimeSlots },
  ] = await Promise.all([
    supabase.from('slot_templates').select('*').eq('is_active', true).order('day_of_week').order('start_time'),
    supabase.from('slot_overrides').select('*').gte('specific_date', weekStartStr).lte('specific_date', weekEndStr),
    supabase.from('recurring_bookings').select('*').in('status', ['pending', 'approved', 'completed', 'paid']).lte('started_date', weekEndStr),
    supabase.from('one_time_bookings').select('*').in('status', ['pending', 'approved', 'completed', 'paid']).gte('specific_date', weekStartStr).lte('specific_date', weekEndStr),
    supabase.from('one_time_slots').select('*').eq('is_active', true).gte('specific_date', weekStartStr).lte('specific_date', weekEndStr),
  ]);

  const templateList: SlotTemplate[] = templates || [];
  const overrideList: SlotOverride[] = overrides || [];
  const recurringList: RecurringBooking[] = recurring || [];
  const otBookingList: OneTimeBooking[] = oneTimeBookings || [];
  const otSlotList: OneTimeSlot[] = oneTimeSlots || [];

  const slots: ComputedSlot[] = [];

  // ── Recurring template slots ──────────────────────────────────────
  for (const date of weekDates) {
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();
    const dayTemplates = templateList.filter((t) => t.day_of_week === dayOfWeek);

    for (const template of dayTemplates) {
      const startTime = formatTime(template.start_time);
      const duration = template.duration_minutes ?? 45;
      const endTime = getEndTime(startTime, duration);

      const override = overrideList.find(
        (o) => o.template_id === template.id && o.specific_date === dateStr
      );

      if (override?.is_blocked) {
        if (forTeacher) {
          slots.push({ date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration, state: 'blocked', template_id: template.id, override_id: override.id });
        }
        continue;
      }

      // One-time booking on this date takes priority over recurring
      const otBooking = otBookingList.find(
        (o) => o.specific_date === dateStr && formatTime(o.start_time) === startTime
      );

      const recBooking = recurringList.find(
        (r) =>
          r.template_id === template.id &&
          r.started_date <= dateStr &&
          (!r.ended_date || r.ended_date >= dateStr)
      );

      const booking = otBooking || recBooking;

      if (!booking) {
        slots.push({ date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration, state: 'available', template_id: template.id });
        continue;
      }

      const slot: ComputedSlot = {
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        state: forTeacher ? bookingToState(booking.status) : 'unavailable',
        template_id: template.id,
        booking_type: otBooking ? 'one_time' : 'recurring',
        booking_id: booking.id,
        booking_status: booking.status,
      };

      if (forTeacher) {
        slot.student_name = booking.student_name;
        slot.student_email = booking.student_email;
        slot.cancel_token = booking.cancel_token;
      }

      slots.push(slot);
    }
  }

  // ── Teacher-created one-time slots ───────────────────────────────
  for (const otSlot of otSlotList) {
    const startTime = formatTime(otSlot.start_time);
    const duration = otSlot.duration_minutes ?? 45;
    const endTime = getEndTime(startTime, duration);
    const dateStr = otSlot.specific_date;

    // Skip if a template slot already occupies this date+time
    const alreadyCovered = slots.some((s) => s.date === dateStr && s.start_time === startTime);
    if (alreadyCovered) continue;

    const booking = otBookingList.find(
      (o) => o.one_time_slot_id === otSlot.id
    );

    if (!booking) {
      slots.push({ date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration, state: 'available', one_time_slot_id: otSlot.id });
      continue;
    }

    const slot: ComputedSlot = {
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      state: forTeacher ? bookingToState(booking.status) : 'unavailable',
      one_time_slot_id: otSlot.id,
      booking_type: 'one_time',
      booking_id: booking.id,
      booking_status: booking.status,
    };

    if (forTeacher) {
      slot.student_name = booking.student_name;
      slot.student_email = booking.student_email;
      slot.cancel_token = booking.cancel_token;
    }

    slots.push(slot);
  }

  slots.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  return slots;
}
