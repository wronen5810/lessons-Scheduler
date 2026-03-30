'use client';

import { useEffect, useState } from 'react';
import { addWeeks, parseISO, subWeeks } from 'date-fns';
import {
  formatDate, formatMonthDisplay, getMonthStr, getMonthWeekStarts,
  getWeekStart, nextMonth, prevMonth, todayInIsrael,
} from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import WeekNav from '@/components/WeekNav';
import TeacherCalendar from '@/components/TeacherCalendar';
import SlotPanel from '@/components/SlotPanel';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type View = 'week' | 'month';

export default function TeacherDashboard() {
  const router = useRouter();
  const today = todayInIsrael();

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [view, setView] = useState<View>('week');
  const [weekStart, setWeekStart] = useState(() => formatDate(getWeekStart(parseISO(today))));
  const [month, setMonth] = useState(() => getMonthStr(today));

  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ComputedSlot | null>(null);

  async function loadWeek(week: string) {
    setLoading(true);
    const res = await fetch(`/api/teacher/slots?week=${week}`);
    setSlots(res.ok ? await res.json() : []);
    setLoading(false);
  }

  async function loadMonth(monthStr: string) {
    setLoading(true);
    const weeks = getMonthWeekStarts(monthStr);
    const results = await Promise.all(weeks.map((w) => fetch(`/api/teacher/slots?week=${w}`).then((r) => r.json())));
    setSlots(results.flat());
    setLoading(false);
  }

  useEffect(() => {
    createBrowserSupabase().auth.getUser().then(({ data }) => {
      if (data.user) setTeacherId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (view === 'week') loadWeek(weekStart);
    else loadMonth(month);
  }, [view, weekStart, month]);

  function handleAction() {
    setSelected(null);
    if (view === 'week') loadWeek(weekStart);
    else loadMonth(month);
  }

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/teacher/login');
  }

  const weekStarts = view === 'week' ? [weekStart] : getMonthWeekStarts(month);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Schedule</h1>
        <div className="flex items-center gap-3">
          <Link href="/teacher/students" className="text-sm text-blue-600 hover:underline">Students</Link>
          <Link href="/teacher/templates" className="text-sm text-blue-600 hover:underline">Manage slots</Link>
          {teacherId && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/t/${teacherId}`;
                navigator.clipboard.writeText(url);
                alert(`Booking link copied:\n${url}`);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-0.5"
            >
              Copy booking link
            </button>
          )}
          <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* View toggle + navigation */}
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
              onPrev={() => setWeekStart(formatDate(subWeeks(parseISO(weekStart), 1)))}
              onNext={() => setWeekStart(formatDate(addWeeks(parseISO(weekStart), 1)))}
              canPrev
              canNext
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
          <TeacherCalendar
            slots={slots}
            weekStarts={weekStarts}
            today={today}
            onSelectSlot={setSelected}
          />
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Open</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-300 inline-block" /> Blocked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Pending</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Approved</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-teal-400 inline-block" /> Completed</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Paid</span>
        </div>
      </main>

      {selected && (
        <SlotPanel slot={selected} onClose={() => setSelected(null)} onAction={handleAction} />
      )}
    </div>
  );
}
