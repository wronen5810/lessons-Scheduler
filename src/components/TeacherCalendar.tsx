'use client';

import { addDays, parseISO } from 'date-fns';
import { DAY_NAMES_SHORT, formatDate } from '@/lib/dates';
import type { CalendarEvent, ComputedSlot } from '@/lib/types';
import SlotCell from './SlotCell';
import EventCell from './EventCell';

interface Props {
  slots: ComputedSlot[];
  weekStarts: string[];
  today: string;
  onSelectSlot: (slot: ComputedSlot) => void;
  onAddSlot?: (date: string) => void;
  timeFormat?: '24h' | '12h';
  events?: CalendarEvent[];
  showEvents?: boolean;
  onSelectEvent?: (event: CalendarEvent) => void;
  onAddEvent?: (date: string) => void;
}

function WeekRow({ weekStart, slots, today, onSelectSlot, onAddSlot, timeFormat = '24h', showDayNames = true, events = [], showEvents = true, onSelectEvent, onAddEvent }: {
  weekStart: string;
  slots: ComputedSlot[];
  today: string;
  onSelectSlot: (slot: ComputedSlot) => void;
  onAddSlot?: (date: string) => void;
  timeFormat?: '24h' | '12h';
  showDayNames?: boolean;
  events?: CalendarEvent[];
  showEvents?: boolean;
  onSelectEvent?: (event: CalendarEvent) => void;
  onAddEvent?: (date: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => formatDate(addDays(parseISO(weekStart), i)));
  const slotsByDay = (date: string) => slots.filter((s) => s.date === date);
  const eventsByDay = (date: string) => events.filter((e) => e.event_date === date);

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {days.map((date, i) => {
        const isToday = date === today;
        const dayNum = date.slice(8);
        const daySlots = slotsByDay(date);
        const dayEvents = eventsByDay(date);

        const isPast = date < today;

        return (
          <div key={date} className={`rounded-lg ${isPast && !isToday ? 'bg-slate-50' : ''}`}>
            <div className="mb-1 pb-1 border-b border-gray-100">
              {showDayNames && (
                <span className="block text-center text-xs font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">{DAY_NAMES_SHORT[i]}</span>
              )}
              <div className="flex items-center justify-center gap-0.5">
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-semibold
                  ${isToday ? 'bg-blue-600 text-white' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                  {dayNum}
                </span>
                {onAddSlot && (
                  <button
                    onClick={() => onAddSlot(date)}
                    className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-blue-500 text-sm leading-none transition-colors"
                    title="Add slot"
                  >+</button>
                )}
                {onAddEvent && (
                  <button
                    onClick={() => onAddEvent(date)}
                    className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-orange-500 text-xs leading-none transition-colors"
                    title="Add event"
                  >📅</button>
                )}
              </div>
            </div>

            {daySlots.length === 0 && (!showEvents || dayEvents.length === 0) ? (
              <div className="text-center text-gray-200 text-xs py-0.5">·</div>
            ) : (
              <>
                {daySlots.map((slot) => (
                  <SlotCell
                    key={`${slot.date}-${slot.start_time}`}
                    slot={slot}
                    onClick={onSelectSlot}
                    isTeacher
                    timeFormat={timeFormat}
                    compact
                  />
                ))}
                {showEvents && dayEvents.map((ev) => (
                  <div key={ev.id} className="mt-0.5">
                    <EventCell event={ev} compact onClick={() => onSelectEvent?.(ev)} />
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TeacherCalendar({ slots, weekStarts, today, onSelectSlot, onAddSlot, timeFormat = '24h', events = [], showEvents = true, onSelectEvent, onAddEvent }: Props) {
  return (
    <div className="space-y-2">
      {weekStarts.map((weekStart, index) => (
        <div key={weekStart} className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 sm:p-3">
          <WeekRow
            weekStart={weekStart}
            slots={slots}
            today={today}
            onSelectSlot={onSelectSlot}
            onAddSlot={onAddSlot}
            timeFormat={timeFormat}
            showDayNames={index === 0}
            events={events}
            showEvents={showEvents}
            onSelectEvent={onSelectEvent}
            onAddEvent={onAddEvent}
          />
        </div>
      ))}
    </div>
  );
}
