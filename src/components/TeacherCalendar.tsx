'use client';

import { addDays, parseISO } from 'date-fns';
import { DAY_NAMES_SHORT, formatDate } from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import SlotCell from './SlotCell';

interface Props {
  slots: ComputedSlot[];
  weekStarts: string[];
  today: string;
  onSelectSlot: (slot: ComputedSlot) => void;
  onAddSlot?: (date: string) => void;
  timeFormat?: '24h' | '12h';
}

function WeekRow({ weekStart, slots, today, onSelectSlot, onAddSlot, timeFormat = '24h', showDayNames = true }: {
  weekStart: string;
  slots: ComputedSlot[];
  today: string;
  onSelectSlot: (slot: ComputedSlot) => void;
  onAddSlot?: (date: string) => void;
  timeFormat?: '24h' | '12h';
  showDayNames?: boolean;
}) {
  const days = Array.from({ length: 7 }, (_, i) => formatDate(addDays(parseISO(weekStart), i)));
  const slotsByDay = (date: string) => slots.filter((s) => s.date === date);

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {days.map((date, i) => {
        const isToday = date === today;
        const dayNum = date.slice(8);
        const daySlots = slotsByDay(date);

        return (
          <div key={date}>
            <div className="flex flex-col items-center mb-2 pb-2 border-b border-gray-100 relative">
              {showDayNames && (
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{DAY_NAMES_SHORT[i]}</span>
              )}
              <span className={`${showDayNames ? 'mt-0.5' : ''} w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {dayNum}
              </span>
              {onAddSlot && (
                <button
                  onClick={() => onAddSlot(date)}
                  className="absolute -bottom-0.5 right-0 w-4 h-4 flex items-center justify-center text-gray-300 hover:text-blue-500 text-sm leading-none transition-colors"
                  title="Add slot"
                >+</button>
              )}
            </div>

            {daySlots.length === 0 ? (
              <div className="text-center text-gray-200 text-xs py-1">·</div>
            ) : (
              daySlots.map((slot) => (
                <SlotCell
                  key={`${slot.date}-${slot.start_time}`}
                  slot={slot}
                  onClick={onSelectSlot}
                  isTeacher
                  timeFormat={timeFormat}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TeacherCalendar({ slots, weekStarts, today, onSelectSlot, onAddSlot, timeFormat = '24h' }: Props) {
  return (
    <div className="space-y-6">
      {weekStarts.map((weekStart, index) => (
        <div key={weekStart} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
          <WeekRow
            weekStart={weekStart}
            slots={slots}
            today={today}
            onSelectSlot={onSelectSlot}
            onAddSlot={onAddSlot}
            timeFormat={timeFormat}
            showDayNames={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
