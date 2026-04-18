'use client';

import { addDays, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { DAY_NAMES_SHORT, formatDate } from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import SlotCell from './SlotCell';
import { useLanguage } from '@/contexts/LanguageContext';
import { DAY_NAMES_SHORT_HE } from '@/lib/i18n';

interface Props {
  slots: ComputedSlot[];
  weekStart: string;
  today: string;
  teacherId?: string;
  email?: string;
  onOwnSlotClick?: (slot: ComputedSlot) => void;
}

export default function WeekCalendar({ slots, weekStart, today, teacherId, email, onOwnSlotClick }: Props) {
  const router = useRouter();
  const { lang } = useLanguage();
  const dayNamesShort = lang === 'he' ? DAY_NAMES_SHORT_HE : DAY_NAMES_SHORT;

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(parseISO(weekStart), i);
    return formatDate(date);
  });

  const slotsByDay = (date: string) => slots.filter((s) => s.date === date);

  function handleSlotClick(slot: ComputedSlot) {
    if (slot.state === 'available') {
      const base = `/t/${teacherId}/request`;
      const emailParam = email ? `&email=${encodeURIComponent(email)}` : '';
      if (slot.one_time_slot_id) {
        router.push(`${base}?oneTimeSlotId=${slot.one_time_slot_id}&date=${slot.date}&time=${slot.start_time}&duration=${slot.duration_minutes}&teacherId=${teacherId}${emailParam}`);
      } else {
        router.push(`${base}?templateId=${slot.template_id}&date=${slot.date}&time=${slot.start_time}&duration=${slot.duration_minutes}&teacherId=${teacherId}${emailParam}`);
      }
      return;
    }
    if (onOwnSlotClick) {
      onOwnSlotClick(slot);
    }
  }

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {days.map((date, i) => {
        const isPast = date < today;
        const isToday = date === today;
        const dayNum = date.slice(8); // DD
        const daySlots = slotsByDay(date);

        return (
          <div key={date} className={isPast ? 'opacity-40' : ''}>
            {/* Day header */}
            <div className="flex flex-col items-center mb-2 pb-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{dayNamesShort[i]}</span>
              <span className={`mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {dayNum}
              </span>
            </div>

            {daySlots.length === 0 ? (
              <div className="text-center text-gray-200 text-xs py-1">·</div>
            ) : (
              daySlots.map((slot) => (
                <SlotCell
                  key={`${slot.date}-${slot.start_time}`}
                  slot={isPast ? { ...slot, state: 'unavailable' } : slot}
                  onClick={isPast ? undefined : handleSlotClick}
                  isTeacher={false}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
