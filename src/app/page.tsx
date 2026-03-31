'use client';

import { useEffect, useState } from 'react';
import { addDays, addWeeks, parseISO, subWeeks } from 'date-fns';
import { formatDate, getWeekStart, todayInIsrael } from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import WeekCalendar from '@/components/WeekCalendar';
import WeekNav from '@/components/WeekNav';

export default function StudentPage() {
  const today = todayInIsrael();
  const [weekStart, setWeekStart] = useState(() => formatDate(getWeekStart(parseISO(today))));
  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const minWeek = formatDate(getWeekStart(parseISO(today)));
  const maxWeek = formatDate(getWeekStart(addWeeks(parseISO(today), 4)));

  // Try to detect a single teacher so the root URL still works
  useEffect(() => {
    fetch('/api/teachers')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.length === 1) setTeacherId(data[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!teacherId) return;
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

  if (!loading && !teacherId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">Please use your teacher&apos;s booking link.</p>
          <p className="text-sm">The URL should look like: <code>/t/&lt;teacher-id&gt;</code></p>
        </div>
      </div>
    );
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
          <WeekCalendar slots={slots} weekStart={weekStart} today={today} teacherId={teacherId ?? ''} />
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
