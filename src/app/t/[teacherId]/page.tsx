'use client';

import { use, useEffect, useState, Suspense } from 'react';
import { addWeeks, parseISO, subWeeks } from 'date-fns';
import {
  formatDate, formatMonthDisplay, getMonthStr, getMonthWeekStarts,
  getWeekStart, nextMonth, prevMonth, todayInIsrael,
} from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import WeekCalendar from '@/components/WeekCalendar';
import WeekNav from '@/components/WeekNav';
import { useSearchParams } from 'next/navigation';

type View = 'week' | 'month';

function StudentCalendar({ teacherId }: { teacherId: string }) {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const today = todayInIsrael();
  const [view, setView] = useState<View>('week');
  const [weekStart, setWeekStart] = useState(() => formatDate(getWeekStart(parseISO(today))));
  const [month, setMonth] = useState(() => getMonthStr(today));
  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const minWeek = formatDate(getWeekStart(parseISO(today)));
  const maxWeek = formatDate(getWeekStart(addWeeks(parseISO(today), 4)));

  async function loadWeek(week: string) {
    setLoading(true);
    const res = await fetch(`/api/slots?week=${week}&teacherId=${teacherId}`);
    setSlots(res.ok ? await res.json() : []);
    setLoading(false);
  }

  async function loadMonth(monthStr: string) {
    setLoading(true);
    const weeks = getMonthWeekStarts(monthStr);
    const results = await Promise.all(
      weeks.map((w) => fetch(`/api/slots?week=${w}&teacherId=${teacherId}`).then((r) => r.json()))
    );
    setSlots(results.flat());
    setLoading(false);
  }

  useEffect(() => {
    if (view === 'week') loadWeek(weekStart);
    else loadMonth(month);
  }, [view, weekStart, month]);

  const weekStarts = view === 'week' ? [weekStart] : getMonthWeekStarts(month);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Book a Lesson</h1>
        <p className="text-sm text-gray-500 mt-0.5">Select an available time slot to request a lesson</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-4">
          {/* Week / Month toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => setView('week')}
              className={`px-4 py-1.5 transition-colors ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-1.5 transition-colors ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Month
            </button>
          </div>

          {/* Navigation */}
          {view === 'week' ? (
            <WeekNav
              weekStart={weekStart}
              onPrev={() => { const p = formatDate(subWeeks(parseISO(weekStart), 1)); if (p >= minWeek) setWeekStart(p); }}
              onNext={() => { const n = formatDate(addWeeks(parseISO(weekStart), 1)); if (n <= maxWeek) setWeekStart(n); }}
              canPrev={weekStart > minWeek}
              canNext={weekStart < maxWeek}
            />
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setMonth(prevMonth(month))} className="p-1.5 rounded hover:bg-gray-100 text-gray-600">&#8592;</button>
              <span className="text-sm font-medium text-gray-900 w-36 text-center">{formatMonthDisplay(month)}</span>
              <button onClick={() => setMonth(nextMonth(month))} className="p-1.5 rounded hover:bg-gray-100 text-gray-600">&#8594;</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-6">
            {weekStarts.map((ws) => (
              <WeekCalendar
                key={ws}
                slots={slots.filter((s) => {
                  const d = parseISO(s.date);
                  const start = parseISO(ws);
                  const end = addWeeks(start, 1);
                  return d >= start && d < end;
                })}
                weekStart={ws}
                today={today}
                teacherId={teacherId}
                email={email}
              />
            ))}
          </div>
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

export default function StudentPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = use(params);
  return (
    <Suspense fallback={<div className="mt-8 text-center text-gray-400">Loading...</div>}>
      <StudentCalendar teacherId={teacherId} />
    </Suspense>
  );
}
