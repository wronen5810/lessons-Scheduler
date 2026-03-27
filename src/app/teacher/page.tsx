'use client';

import { useEffect, useState } from 'react';
import { addWeeks, parseISO, subWeeks } from 'date-fns';
import { formatDate, getWeekStart, todayInIsrael } from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import WeekNav from '@/components/WeekNav';
import TeacherCalendar from '@/components/TeacherCalendar';
import SlotPanel from '@/components/SlotPanel';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeacherDashboard() {
  const router = useRouter();
  const today = todayInIsrael();
  const [weekStart, setWeekStart] = useState(() => formatDate(getWeekStart(parseISO(today))));
  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ComputedSlot | null>(null);

  async function loadSlots(week: string) {
    setLoading(true);
    const res = await fetch(`/api/teacher/slots?week=${week}`);
    const data = await res.json();
    setSlots(data);
    setLoading(false);
  }

  useEffect(() => { loadSlots(weekStart); }, [weekStart]);

  function prevWeek() { setWeekStart(formatDate(subWeeks(parseISO(weekStart), 1))); }
  function nextWeek() { setWeekStart(formatDate(addWeeks(parseISO(weekStart), 1))); }

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/teacher/login');
  }

  function handleAction() {
    setSelected(null);
    loadSlots(weekStart);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Schedule</h1>
        <div className="flex items-center gap-3">
          <Link href="/teacher/students" className="text-sm text-blue-600 hover:underline">
            Students
          </Link>
          <Link href="/teacher/templates" className="text-sm text-blue-600 hover:underline">
            Manage slots
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <WeekNav
          weekStart={weekStart}
          onPrev={prevWeek}
          onNext={nextWeek}
          canPrev
          canNext
        />

        {loading ? (
          <div className="mt-8 text-center text-gray-400">Loading...</div>
        ) : (
          <TeacherCalendar
            slots={slots}
            weekStart={weekStart}
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
        <SlotPanel
          slot={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
