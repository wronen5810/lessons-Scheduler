'use client';

import type { CalendarEvent, CalendarEventType } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';

const EVENT_CONFIG: Record<CalendarEventType, { icon: string; bg: string; border: string; text: string }> = {
  exam:      { icon: '📝', bg: 'bg-red-100',  border: 'border-red-300',  text: 'text-red-800' },
  task:      { icon: '✅', bg: 'bg-red-50',   border: 'border-red-200',  text: 'text-red-700' },
  paperwork: { icon: '📄', bg: 'bg-rose-50',  border: 'border-rose-200', text: 'text-rose-700' },
  vacation:  { icon: '🏖', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800' },
  other:     { icon: '📌', bg: 'bg-pink-50',  border: 'border-pink-200', text: 'text-pink-700' },
};

export default function EventCell({
  event,
  compact = false,
  onClick,
}: {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}) {
  const { t } = useLanguage();
  const cfg = EVENT_CONFIG[event.event_type];

  const typeLabel = t(`events.${event.event_type}` as Parameters<typeof t>[0]);

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-start px-1.5 py-0.5 rounded text-[10px] font-medium border truncate leading-tight
          ${cfg.bg} ${cfg.border} ${cfg.text} hover:opacity-80 transition-opacity`}
        title={`${typeLabel}: ${event.description}`}
      >
        {cfg.icon} {event.description}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-start px-2 py-1.5 rounded-lg border text-xs font-medium leading-snug
        ${cfg.bg} ${cfg.border} ${cfg.text} hover:opacity-80 transition-opacity`}
    >
      <div className="flex items-center gap-1 flex-wrap">
        <span className="flex-shrink-0">{cfg.icon}</span>
        <span className="font-semibold">{typeLabel}</span>
        {event.event_time && (
          <span className="opacity-70">{event.event_time.slice(0, 5)}</span>
        )}
        {event.created_by === 'student' && event.student_name && (
          <span className="opacity-60 text-[10px]">— {event.student_name}</span>
        )}
      </div>
      <div className="mt-0.5 truncate opacity-90">{event.description}</div>
    </button>
  );
}
