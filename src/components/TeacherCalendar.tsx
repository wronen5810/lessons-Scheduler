'use client';

import { addDays, parseISO } from 'date-fns';
import { DAY_NAMES_SHORT, formatDate, formatDisplayDate } from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import SlotCell from './SlotCell';

interface Props {
  slots: ComputedSlot[];
  weekStart: string;
  today: string;
  onSelectSlot: (slot: ComputedSlot) => void;
}

export default function TeacherCalendar({ slots, weekStart, today, onSelectSlot }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(parseISO(weekStart), i);
    return formatDate(date);
  });

  const slotsByDay = (date: string) => slots.filter((s) => s.date === date);

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((date, i) => {
        const isToday = date === today;
        const daySlots = slotsByDay(date);

        return (
          <div key={date}>
            <div
              className={`text-center mb-2 pb-1 border-b ${isToday ? 'border-blue-400' : 'border-gray-200'}`}
            >
              <div className="text-xs font-medium text-gray-500">{DAY_NAMES_SHORT[i]}</div>
              <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {formatDisplayDate(date).split(',')[1]?.trim() ?? formatDisplayDate(date)}
              </div>
            </div>

            {daySlots.length === 0 ? (
              <div className="text-center text-xs text-gray-300 py-2">—</div>
            ) : (
              daySlots.map((slot) => (
                <SlotCell
                  key={`${slot.date}-${slot.start_time}`}
                  slot={slot}
                  onClick={onSelectSlot}
                  isTeacher
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
