'use client';

import { use, useEffect, useState } from 'react';
import { addDays, addWeeks, parseISO, subWeeks } from 'date-fns';
import { formatDate, getWeekStart, todayInIsrael } from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import WeekCalendar from '@/components/WeekCalendar';
import WeekNav from '@/components/WeekNav';

export default function StudentPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = use(params);
  const today = todayInIsrael();
  const [weekStart, setWeekStart] = useState(() => formatDate(getWeekStart(parseISO(today))));
  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const minWeek = formatDate(getWeekStart(parseISO(today)));
  const maxWeek = formatDate(getWeekStart(addWeeks(parseISO(today), 4)));

  useEffect(() => {
    setLoading(true);
    fetch(`/api/slots?week=${weekStart}&teacherId=${teacherId}`)
      .then((r) => r.json())
      .then((data) => { setSlots(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [weekStart, teacherId]);

  function prevWeek() {
    const prev = formatDate(subWeeks(parseISO(weekStart), 1));
    if (prev >= minWeek) setWeekStart(prev);
  }

  function nextWeek() {
    const next = formatDate(addWeeks(parseISO(weekStart), 1));
    if (next <= maxWeek) setWeekStart(next);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Book a Lesson</h1>
        <p className="text-sm text-gray-500 mt-0.5">Select an available time slot to request a lesson</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <WeekNav
          weekStart={weekStart}
          onPrev={prevWeek}
          onNext={nextWeek}
          canPrev={weekStart > minWeek}
          canNext={weekStart < maxWeek}
        />

        {loading ? (
          <div className="mt-8 text-center text-gray-400">Loading...</div>
        ) : (
          <WeekCalendar slots={slots} weekStart={weekStart} today={today} teacherId={teacherId} />
        )}

        <div className="mt-6 flex gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-300 inline-block" /> Unavailable
          </span>
        </div>
      </main>
    </div>
  );
}
