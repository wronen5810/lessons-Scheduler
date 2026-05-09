import { addDays, parseISO } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatDate, formatTime, getEndTime } from './dates';
import type {
  ComputedSlot,
  OneTimeBooking,
  OneTimeSlot,
  ParticipantInfo,
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

// OT booking with start time pre-formatted (avoids repeated formatTime calls in hot loop)
type EnrichedOTBooking = OneTimeBooking & { _timeFmt: string };

export async function computeRangeSlots(
  startStr: string,
  endStr: string,
  supabase: SupabaseClient,
  forTeacher = false,
  teacherId: string,
  studentEmail?: string,
  studentGroupIds?: Set<string>,
): Promise<ComputedSlot[]> {
  const startDate = parseISO(startStr);
  const endDate = parseISO(endStr);
  const rangeDates: Date[] = [];
  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    rangeDates.push(new Date(d));
  }

  const [
    { data: templates },
    { data: overrides },
    { data: recurring },
    { data: oneTimeBookings },
    { data: oneTimeSlots },
    { data: groups },
  ] = await Promise.all([
    supabase.from('slot_templates').select('*').eq('teacher_id', teacherId).eq('is_active', true).order('day_of_week').order('start_time'),
    supabase.from('slot_overrides').select('*').eq('teacher_id', teacherId).gte('specific_date', startStr).lte('specific_date', endStr),
    supabase.from('recurring_bookings').select('*').eq('teacher_id', teacherId).in('status', ['pending', 'approved', 'completed', 'paid', 'cancellation_requested']).gte('lesson_date', startStr).lte('lesson_date', endStr),
    supabase.from('one_time_bookings').select('*').eq('teacher_id', teacherId).in('status', ['pending', 'approved', 'completed', 'paid', 'cancellation_requested']).gte('specific_date', startStr).lte('specific_date', endStr),
    supabase.from('one_time_slots').select('*').eq('teacher_id', teacherId).eq('is_active', true).gte('specific_date', startStr).lte('specific_date', endStr),
    supabase.from('student_groups').select('id, name').eq('teacher_id', teacherId),
  ]);

  const templateList: SlotTemplate[] = templates || [];
  const overrideList: SlotOverride[] = overrides || [];
  const recurringList: RecurringBooking[] = recurring || [];
  const otBookingList: OneTimeBooking[] = oneTimeBookings || [];
  const otSlotList: OneTimeSlot[] = oneTimeSlots || [];

  // ── Build group name lookup ─────────────────────────────────────────────
  const groupNameMap = new Map<string, string>((groups ?? []).map((g: { id: string; name: string }) => [g.id, g.name]));

  // Fetch member counts only for groups referenced in this week's bookings
  const bookingGroupIds = new Set<string>();
  for (const b of [...recurringList, ...otBookingList]) {
    const gid = (b as { group_id?: string | null }).group_id;
    if (gid) bookingGroupIds.add(gid);
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

  // ── Pre-build Maps for O(1) lookups in the hot loop ────────────────────

  // Templates grouped by day_of_week
  const templatesByDay = new Map<number, SlotTemplate[]>();
  for (const t of templateList) {
    if (!templatesByDay.has(t.day_of_week)) templatesByDay.set(t.day_of_week, []);
    templatesByDay.get(t.day_of_week)!.push(t);
  }

  // Overrides: "templateId|date" → override
  const overrideMap = new Map<string, SlotOverride>();
  for (const o of overrideList) {
    overrideMap.set(`${o.template_id}|${o.specific_date}`, o);
  }

  // Recurring bookings: "templateId|date" → booking[]
  const recurringByTemplateDate = new Map<string, RecurringBooking[]>();
  for (const r of recurringList) {
    const key = `${r.template_id}|${r.lesson_date}`;
    if (!recurringByTemplateDate.has(key)) recurringByTemplateDate.set(key, []);
    recurringByTemplateDate.get(key)!.push(r);
  }

  // OT bookings with pre-formatted time
  const enrichedOT: EnrichedOTBooking[] = otBookingList.map(b => ({ ...b, _timeFmt: formatTime(b.start_time) }));

  // First OT booking by "date|time" (for single-participant template slot lookup)
  const otFirstByDateTime = new Map<string, EnrichedOTBooking>();
  // OT bookings grouped by one_time_slot_id
  const otBySlotId = new Map<string, EnrichedOTBooking[]>();
  // OT bookings with no slot_id, grouped by "date|time"
  const otOrphansByDateTime = new Map<string, EnrichedOTBooking[]>();

  for (const b of enrichedOT) {
    const dtKey = `${b.specific_date}|${b._timeFmt}`;
    if (!otFirstByDateTime.has(dtKey)) otFirstByDateTime.set(dtKey, b);
    if (b.one_time_slot_id) {
      if (!otBySlotId.has(b.one_time_slot_id)) otBySlotId.set(b.one_time_slot_id, []);
      otBySlotId.get(b.one_time_slot_id)!.push(b);
    } else {
      if (!otOrphansByDateTime.has(dtKey)) otOrphansByDateTime.set(dtKey, []);
      otOrphansByDateTime.get(dtKey)!.push(b);
    }
  }

  // All OT bookings for an OT slot (by slot_id + orphaned by date|time)
  function getOtBookingsForSlot(slotId: string, dateStr: string, startTime: string): EnrichedOTBooking[] {
    return [
      ...(otBySlotId.get(slotId) ?? []),
      ...(otOrphansByDateTime.get(`${dateStr}|${startTime}`) ?? []),
    ];
  }

  // Track which date|time slots are already covered by template slots
  // (used to skip OT slots that overlap)
  const coveredSlotKeys = new Set<string>();

  const slots: ComputedSlot[] = [];

  // ── Recurring template slots ──────────────────────────────────────────
  for (const date of rangeDates) {
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();
    const dayTemplates = templatesByDay.get(dayOfWeek) ?? [];

    for (const template of dayTemplates) {
      if (template.end_date && dateStr > template.end_date) continue;
      const startTime = formatTime(template.start_time);
      const duration = template.duration_minutes ?? 45;
      const endTime = getEndTime(startTime, duration);
      const title = template.title ?? undefined;
      const maxParticipants = template.max_participants ?? 1;
      const templateEndDate = template.end_date ?? undefined;
      const dtKey = `${dateStr}|${startTime}`;

      const override = overrideMap.get(`${template.id}|${dateStr}`);
      if (override?.is_blocked) {
        if (forTeacher) {
          slots.push({ date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration, state: 'blocked', template_id: template.id, override_id: override.id, title, max_participants: maxParticipants, template_end_date: templateEndDate });
          coveredSlotKeys.add(dtKey);
        }
        continue;
      }

      coveredSlotKeys.add(dtKey);

      // One-time booking on this date takes priority (single-participant)
      const otBooking = otFirstByDateTime.get(dtKey);

      const allRec = recurringByTemplateDate.get(`${template.id}|${dateStr}`) ?? [];

      if (maxParticipants <= 1) {
        // ── Single-participant ──────────────────────────────────────────
        const recBooking = allRec.find(
          (r) => forTeacher || ['pending', 'approved', 'cancellation_requested'].includes(r.status)
        );
        const booking = otBooking || recBooking;

        if (!booking) {
          slots.push({ date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration, state: 'available', template_id: template.id, title, max_participants: 1, template_end_date: templateEndDate });
          continue;
        }

        const bookingGroupId = (booking as { group_id?: string | null }).group_id;
        const isOwnBooking = (!!studentEmail && booking.student_email.toLowerCase() === studentEmail.toLowerCase())
          || (!!bookingGroupId && !!studentGroupIds && studentGroupIds.has(bookingGroupId));
        const slot: ComputedSlot = {
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: duration,
          state: forTeacher ? bookingToState(booking.status) : (isOwnBooking ? bookingToState(booking.status) : 'unavailable'),
          template_id: template.id,
          title,
          max_participants: 1,
          template_end_date: templateEndDate,
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

        if (bookingGroupId) {
          slot.group_id = bookingGroupId;
          slot.group_name = groupNameMap.get(bookingGroupId);
          slot.group_member_count = groupMemberCountMap.get(bookingGroupId);
        }

        slots.push(slot);
      } else {
        // ── Multi-participant ───────────────────────────────────────────
        const recBookings = forTeacher
          ? allRec
          : allRec.filter((r) => ['pending', 'approved', 'cancellation_requested'].includes(r.status));

        const participantCount = recBookings.length;
        const isFull = participantCount >= maxParticipants;

        if (forTeacher) {
          const participants: ParticipantInfo[] = recBookings.map((b) => ({
            booking_id: b.id,
            booking_type: 'recurring' as const,
            student_name: b.student_name,
            student_email: b.student_email,
            status: b.status,
            cancel_token: b.cancel_token,
          }));

          let state: import('./types').SlotState;
          if (!isFull) {
            state = 'available';
          } else if (recBookings.some((b) => b.status === 'cancellation_requested')) {
            state = 'cancellation_requested';
          } else if (recBookings.some((b) => b.status === 'pending')) {
            state = 'pending';
          } else if (recBookings.some((b) => b.status === 'completed')) {
            state = 'completed';
          } else if (recBookings.some((b) => b.status === 'paid')) {
            state = 'paid';
          } else {
            state = 'confirmed';
          }

          slots.push({
            date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration,
            state, template_id: template.id, title, max_participants: maxParticipants,
            template_end_date: templateEndDate, participant_count: participantCount,
            ...(participants.length > 0 && { participants }),
          });
        } else {
          const ownBooking = recBookings.find((r) => {
            const gid = (r as { group_id?: string | null }).group_id;
            return (
              (!!studentEmail && r.student_email.toLowerCase() === studentEmail.toLowerCase()) ||
              (!!gid && !!studentGroupIds && studentGroupIds.has(gid))
            );
          });

          if (ownBooking) {
            const bookingGroupId = (ownBooking as { group_id?: string | null }).group_id;
            const slot: ComputedSlot = {
              date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration,
              state: bookingToState(ownBooking.status), template_id: template.id, title,
              max_participants: maxParticipants, template_end_date: templateEndDate, participant_count: participantCount,
              booking_type: 'recurring', booking_id: ownBooking.id, booking_status: ownBooking.status,
              student_name: ownBooking.student_name, student_email: ownBooking.student_email,
              cancel_token: ownBooking.cancel_token,
              cancellation_reason: ownBooking.cancellation_reason ?? undefined,
            };
            if (bookingGroupId) {
              slot.group_id = bookingGroupId;
              slot.group_name = groupNameMap.get(bookingGroupId);
              slot.group_member_count = groupMemberCountMap.get(bookingGroupId);
            }
            slots.push(slot);
          } else if (!isFull) {
            slots.push({
              date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration,
              state: 'available', template_id: template.id, title,
              max_participants: maxParticipants, template_end_date: templateEndDate, participant_count: participantCount,
            });
          } else {
            slots.push({
              date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration,
              state: 'unavailable', template_id: template.id, title, max_participants: maxParticipants, template_end_date: templateEndDate,
            });
          }
        }
      }
    }
  }

  // ── Teacher-created one-time slots ────────────────────────────────────
  for (const otSlot of otSlotList) {
    const startTime = formatTime(otSlot.start_time);
    const duration = otSlot.duration_minutes ?? 45;
    const endTime = getEndTime(startTime, duration);
    const dateStr = otSlot.specific_date;
    const title = otSlot.title ?? undefined;
    const maxParticipants = otSlot.max_participants ?? 1;

    // Skip if a template slot already occupies this date+time
    if (coveredSlotKeys.has(`${dateStr}|${startTime}`)) continue;

    if (maxParticipants <= 1) {
      // ── Single-participant ────────────────────────────────────────────
      const slotBookings = getOtBookingsForSlot(otSlot.id, dateStr, startTime);
      const booking = slotBookings[0];

      if (!booking) {
        slots.push({ date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration, state: 'available', one_time_slot_id: otSlot.id, title, max_participants: 1 });
        continue;
      }

      const otBookingGroupId = (booking as { group_id?: string | null }).group_id;
      const isOwnBooking = (!!studentEmail && booking.student_email.toLowerCase() === studentEmail.toLowerCase())
        || (!!otBookingGroupId && !!studentGroupIds && studentGroupIds.has(otBookingGroupId));
      const slot: ComputedSlot = {
        date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration,
        state: forTeacher ? bookingToState(booking.status) : (isOwnBooking ? bookingToState(booking.status) : 'unavailable'),
        one_time_slot_id: otSlot.id, title, max_participants: 1,
        booking_type: 'one_time', booking_id: booking.id, booking_status: booking.status,
      };

      if (forTeacher || isOwnBooking) {
        slot.student_name = booking.student_name;
        slot.student_email = booking.student_email;
        slot.cancel_token = booking.cancel_token;
        slot.cancellation_reason = booking.cancellation_reason ?? undefined;
      }

      if (otBookingGroupId) {
        slot.group_id = otBookingGroupId;
        slot.group_name = groupNameMap.get(otBookingGroupId);
        slot.group_member_count = groupMemberCountMap.get(otBookingGroupId);
      }

      slots.push(slot);
    } else {
      // ── Multi-participant one-time slot ───────────────────────────────
      const slotBookings = getOtBookingsForSlot(otSlot.id, dateStr, startTime);
      const participantCount = slotBookings.length;
      const isFull = participantCount >= maxParticipants;

      if (forTeacher) {
        const participants: ParticipantInfo[] = slotBookings.map((b) => ({
          booking_id: b.id,
          booking_type: 'one_time' as const,
          student_name: b.student_name,
          student_email: b.student_email,
          status: b.status,
          cancel_token: b.cancel_token,
        }));

        let state: import('./types').SlotState;
        if (!isFull) {
          state = 'available';
        } else if (slotBookings.some((b) => b.status === 'cancellation_requested')) {
          state = 'cancellation_requested';
        } else if (slotBookings.some((b) => b.status === 'pending')) {
          state = 'pending';
        } else if (slotBookings.some((b) => b.status === 'completed')) {
          state = 'completed';
        } else if (slotBookings.some((b) => b.status === 'paid')) {
          state = 'paid';
        } else {
          state = 'confirmed';
        }

        slots.push({
          date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration,
          state, one_time_slot_id: otSlot.id, title, max_participants: maxParticipants,
          participant_count: participantCount,
          ...(participants.length > 0 && { participants }),
        });
      } else {
        const ownBooking = slotBookings.find((b) => {
          const gid = (b as { group_id?: string | null }).group_id;
          return (
            (!!studentEmail && b.student_email.toLowerCase() === studentEmail.toLowerCase()) ||
            (!!gid && !!studentGroupIds && studentGroupIds.has(gid))
          );
        });

        if (ownBooking) {
          slots.push({
            date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration,
            state: bookingToState(ownBooking.status), one_time_slot_id: otSlot.id, title,
            max_participants: maxParticipants, participant_count: participantCount,
            booking_type: 'one_time', booking_id: ownBooking.id, booking_status: ownBooking.status,
            student_name: ownBooking.student_name, student_email: ownBooking.student_email,
            cancel_token: ownBooking.cancel_token,
            cancellation_reason: ownBooking.cancellation_reason ?? undefined,
          });
        } else if (!isFull) {
          slots.push({
            date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration,
            state: 'available', one_time_slot_id: otSlot.id, title,
            max_participants: maxParticipants, participant_count: participantCount,
          });
        } else {
          slots.push({
            date: dateStr, start_time: startTime, end_time: endTime, duration_minutes: duration,
            state: 'unavailable', one_time_slot_id: otSlot.id, title, max_participants: maxParticipants,
          });
        }
      }
    }
  }

  slots.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  return slots;
}

export async function computeWeekSlots(
  weekStartStr: string,
  supabase: SupabaseClient,
  forTeacher = false,
  teacherId: string,
  studentEmail?: string,
  studentGroupIds?: Set<string>,
): Promise<ComputedSlot[]> {
  return computeRangeSlots(
    weekStartStr,
    formatDate(addDays(parseISO(weekStartStr), 6)),
    supabase,
    forTeacher,
    teacherId,
    studentEmail,
    studentGroupIds,
  );
}
