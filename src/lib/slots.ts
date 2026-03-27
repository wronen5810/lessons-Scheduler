import { addDays, parseISO } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatDate, formatTime, getEndTime, getWeekDates } from './dates';
import type { ComputedSlot, OneTimeBooking, RecurringBooking, SlotOverride, SlotTemplate } from './types';

export async function computeWeekSlots(
  weekStartStr: string,
  supabase: SupabaseClient,
  forTeacher = false
): Promise<ComputedSlot[]> {
  const weekStart = parseISO(weekStartStr);
  const weekDates = getWeekDates(weekStart);
  const weekEndStr = formatDate(addDays(weekStart, 6));

  const [{ data: templates }, { data: overrides }, { data: recurring }, { data: oneTime }] =
    await Promise.all([
      supabase
        .from('slot_templates')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time'),
      supabase
        .from('slot_overrides')
        .select('*')
        .gte('specific_date', weekStartStr)
        .lte('specific_date', weekEndStr),
      supabase
        .from('recurring_bookings')
        .select('*')
        .in('status', ['pending', 'approved'])
        .lte('started_date', weekEndStr),
      supabase
        .from('one_time_bookings')
        .select('*')
        .in('status', ['pending', 'approved'])
        .gte('specific_date', weekStartStr)
        .lte('specific_date', weekEndStr),
    ]);

  const templateList: SlotTemplate[] = templates || [];
  const overrideList: SlotOverride[] = overrides || [];
  const recurringList: RecurringBooking[] = recurring || [];
  const oneTimeList: OneTimeBooking[] = oneTime || [];

  const slots: ComputedSlot[] = [];

  for (const date of weekDates) {
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();
    const dayTemplates = templateList.filter((t) => t.day_of_week === dayOfWeek);

    for (const template of dayTemplates) {
      const startTime = formatTime(template.start_time);
      const endTime = getEndTime(startTime);

      const override = overrideList.find(
        (o) => o.template_id === template.id && o.specific_date === dateStr
      );

      if (override?.is_blocked) {
        if (forTeacher) {
          slots.push({
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            state: 'blocked',
            template_id: template.id,
            override_id: override.id,
          });
        }
        continue;
      }

      // One-time booking takes priority over recurring for a specific date
      const otBooking = oneTimeList.find(
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
        slots.push({
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          state: 'available',
          template_id: template.id,
        });
        continue;
      }

      const isRecurring = !otBooking;

      let state: ComputedSlot['state'];
      if (forTeacher) {
        state = booking.status === 'approved' ? 'confirmed' : 'pending';
      } else {
        state = 'unavailable';
      }

      const slot: ComputedSlot = {
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        state,
        template_id: template.id,
        booking_type: isRecurring ? 'recurring' : 'one_time',
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

  return slots;
}
