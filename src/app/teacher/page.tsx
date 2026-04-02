'use client';

import { useEffect, useState } from 'react';
import { addWeeks, parseISO, subWeeks } from 'date-fns';
import {
  formatDate, formatMonthDisplay, getMonthStr, getMonthWeekStarts,
  getWeekStart, nextMonth, prevMonth, todayInIsrael,
} from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import type { PendingRequest } from '@/app/api/teacher/requests/route';
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
  const [view, setView] = useState<View>('month');
  const [weekStart, setWeekStart] = useState(() => formatDate(getWeekStart(parseISO(today))));
  const [month, setMonth] = useState(() => getMonthStr(today));

  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ComputedSlot | null>(null);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  async function loadRequests() {
    setRequestsLoading(true);
    const res = await fetch('/api/teacher/requests');
    setRequests(res.ok ? await res.json() : []);
    setRequestsLoading(false);
  }

  useEffect(() => { loadRequests(); }, []);

  async function handleRequestAction(req: PendingRequest, action: 'approve' | 'reject' | 'approve-cancellation') {
    setActionLoading(req.id);
    await fetch(`/api/bookings/${req.id}?type=${req.booking_type}&action=${action}`, { method: 'PATCH' });
    setActionLoading(null);
    loadRequests();
    if (view === 'week') loadWeek(weekStart);
    else loadMonth(month);
  }

  function handleAction() {
    setSelected(null);
    loadRequests();
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Schedule</h1>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          <Link href="/teacher/students" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Students</Link>
          <Link href="/teacher/templates" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Slots</Link>
          <button
            onClick={() => { loadRequests(); if (view === 'week') loadWeek(weekStart); else loadMonth(month); }}
            className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            ↺
          </button>
          <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-5">

        {/* View toggle + navigation */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-sm">
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 font-medium transition-colors ${view === 'week' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 font-medium transition-colors ${view === 'month' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Month
            </button>
          </div>

          {view === 'week' ? (
            <WeekNav
              weekStart={weekStart}
              onPrev={() => setWeekStart(formatDate(subWeeks(parseISO(weekStart), 1)))}
              onNext={() => setWeekStart(formatDate(addWeeks(parseISO(weekStart), 1)))}
              canPrev
              canNext
            />
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setMonth(prevMonth(month))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8592;</button>
              <span className="text-sm font-semibold text-gray-800 w-32 text-center">{formatMonthDisplay(month)}</span>
              <button onClick={() => setMonth(nextMonth(month))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8594;</button>
            </div>
          )}
        </div>

        {/* Pending requests panel */}
        {!requestsLoading && requests.length > 0 && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">
                Pending Requests <span className="ml-1.5 bg-red-100 text-red-700 text-xs font-medium px-1.5 py-0.5 rounded-full">{requests.length}</span>
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {requests.map((req) => {
                const isCancel = req.request_type === 'cancellation_request';
                const isRecurring = req.booking_type === 'recurring';
                const busy = actionLoading === req.id;
                return (
                  <div key={req.id} className="px-4 py-3 flex items-start gap-4">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${isCancel ? 'bg-orange-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{req.student_name}</span>
                        <span className="text-xs text-gray-500">{req.student_email}</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isCancel ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isCancel ? 'Cancel request' : 'Lesson request'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {req.date} &middot; {req.start_time}–{req.end_time}
                        {isRecurring && !isCancel && ' · Recurring'}
                      </div>
                      {isCancel && req.cancellation_reason && (
                        <div className="text-xs text-gray-500 mt-0.5 italic">&ldquo;{req.cancellation_reason}&rdquo;</div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRequestAction(req, isCancel ? 'approve-cancellation' : 'approve')}
                        disabled={busy}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isCancel ? 'Approve' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRequestAction(req, isCancel ? 'approve' : 'reject')}
                        disabled={busy}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        {isCancel ? 'Deny' : 'Reject'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

        <div className="mt-5 flex flex-wrap gap-3">
          {[
            { color: 'bg-emerald-400', label: 'Open' },
            { color: 'bg-gray-400',    label: 'Blocked' },
            { color: 'bg-amber-400',   label: 'Pending' },
            { color: 'bg-blue-500',    label: 'Approved' },
            { color: 'bg-teal-500',    label: 'Completed' },
            { color: 'bg-emerald-500', label: 'Paid' },
            { color: 'bg-orange-400',  label: 'Cancel req.' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </main>

      {selected && (
        <SlotPanel slot={selected} onClose={() => setSelected(null)} onAction={handleAction} />
      )}
    </div>
  );
}
