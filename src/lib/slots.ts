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
  if (status === 'cancellation_requested') return 'cancellation_requested';
  return 'pending';
}

export async function computeWeekSlots(
  weekStartStr: string,
  supabase: SupabaseClient,
  forTeacher = false,
  teacherId: string,
  studentEmail?: string,
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
    { data: groups },
  ] = await Promise.all([
    supabase.from('slot_templates').select('*').eq('teacher_id', teacherId).eq('is_active', true).order('day_of_week').order('start_time'),
    supabase.from('slot_overrides').select('*').eq('teacher_id', teacherId).gte('specific_date', weekStartStr).lte('specific_date', weekEndStr),
    supabase.from('recurring_bookings').select('*').eq('teacher_id', teacherId).in('status', ['pending', 'approved', 'completed', 'paid', 'cancellation_requested']).gte('lesson_date', weekStartStr).lte('lesson_date', weekEndStr),
    supabase.from('one_time_bookings').select('*').eq('teacher_id', teacherId).in('status', ['pending', 'approved', 'completed', 'paid', 'cancellation_requested']).gte('specific_date', weekStartStr).lte('specific_date', weekEndStr),
    supabase.from('one_time_slots').select('*').eq('teacher_id', teacherId).eq('is_active', true).gte('specific_date', weekStartStr).lte('specific_date', weekEndStr),
    supabase.from('student_groups').select('id, name').eq('teacher_id', teacherId),
  ]);

  // Build group name lookup and member count map
  const groupNameMap = new Map<string, string>((groups ?? []).map((g: { id: string; name: string }) => [g.id, g.name]));

  // Fetch member counts for groups referenced in this week's bookings
  const bookingGroupIds = new Set<string>();
  for (const b of [...(recurring ?? []), ...(oneTimeBookings ?? [])]) {
    if ((b as { group_id?: string | null }).group_id) bookingGroupIds.add((b as { group_id: string }).group_id);
  }
  const groupMemberCountMap = new Map<string, number>();
  if (bookingGroupIds.size > 0) {
    const { data: memberCounts } = await supabase
      .from('student_group_members')
      .select('group_id')
      .in('group_id', [...bookingGroupIds]);
    for (const m of memberCounts ?? []) {
      groupMemberCountMap.set(m.group_id, (groupMemberCountMap.get(m.group_id) ?? 0) + 1);
    }
  }

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
          r.lesson_date === dateStr &&
          (forTeacher || ['pending', 'approved', 'cancellation_requested'].includes(r.status))
      );

      const booking = otBooking || recBooking;

      if (!booking) {
        slots.push({ date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration, state: 'available', template_id: template.id });
        continue;
      }

      const isOwnBooking = !!studentEmail && booking.student_email.toLowerCase() === studentEmail.toLowerCase();
      const slot: ComputedSlot = {
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        state: forTeacher ? bookingToState(booking.status) : (isOwnBooking ? bookingToState(booking.status) : 'unavailable'),
        template_id: template.id,
        booking_type: otBooking ? 'one_time' : 'recurring',
        booking_id: booking.id,
        booking_status: booking.status,
      };

      if (forTeacher || isOwnBooking) {
        slot.student_name = booking.student_name;
        slot.student_email = booking.student_email;
        slot.cancel_token = booking.cancel_token;
        slot.cancellation_reason = booking.cancellation_reason ?? undefined;
      }

      const bookingGroupId = (booking as { group_id?: string | null }).group_id;
      if (bookingGroupId) {
        slot.group_id = bookingGroupId;
        slot.group_name = groupNameMap.get(bookingGroupId);
        slot.group_member_count = groupMemberCountMap.get(bookingGroupId);
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
      (o) =>
        o.one_time_slot_id === otSlot.id ||
        (o.one_time_slot_id == null && o.specific_date === dateStr && formatTime(o.start_time) === startTime)
    );

    if (!booking) {
      slots.push({ date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration, state: 'available', one_time_slot_id: otSlot.id });
      continue;
    }

    const isOwnBooking = !!studentEmail && booking.student_email.toLowerCase() === studentEmail.toLowerCase();
    const slot: ComputedSlot = {
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      state: forTeacher ? bookingToState(booking.status) : (isOwnBooking ? bookingToState(booking.status) : 'unavailable'),
      one_time_slot_id: otSlot.id,
      booking_type: 'one_time',
      booking_id: booking.id,
      booking_status: booking.status,
    };

    if (forTeacher || isOwnBooking) {
      slot.student_name = booking.student_name;
      slot.student_email = booking.student_email;
      slot.cancel_token = booking.cancel_token;
      slot.cancellation_reason = booking.cancellation_reason ?? undefined;
    }

    const otBookingGroupId = (booking as { group_id?: string | null }).group_id;
    if (otBookingGroupId) {
      slot.group_id = otBookingGroupId;
      slot.group_name = groupNameMap.get(otBookingGroupId);
      slot.group_member_count = groupMemberCountMap.get(otBookingGroupId);
    }

    slots.push(slot);
  }

  slots.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  return slots;
}
