'use client';

import { parseISO, addDays } from 'date-fns';
import { formatDisplayDate } from '@/lib/dates';

interface Props {
  weekStart: string;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export default function WeekNav({ weekStart, onPrev, onNext, canPrev, canNext }: Props) {
  const weekEnd = addDays(parseISO(weekStart), 6);

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        &larr; Prev
      </button>

      <span className="text-sm font-medium text-gray-700">
        {formatDisplayDate(weekStart)} &ndash; {formatDisplayDate(weekEnd.toISOString().slice(0, 10))}
      </span>

      <button
        onClick={onNext}
        disabled={!canNext}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next &rarr;
      </button>
    </div>
  );
}
