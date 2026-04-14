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
import { DAY_NAMES } from '@/lib/dates';
import StudentNotebook from '@/components/StudentNotebook';

type View = 'week' | 'month';
type Section = 'schedule' | 'notebook';

interface StudentBooking {
  id: string;
  booking_type: 'recurring' | 'one_time';
  status: string;
  start_time: string;
  end_time: string;
  day_of_week?: number;
  started_date?: string;
  specific_date?: string;
  cancellation_reason?: string;
  is_group?: boolean;
  group_name?: string;
}

function StudentCalendar({ teacherId }: { teacherId: string }) {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const today = todayInIsrael();
  const [section, setSection] = useState<Section>('schedule');
  const [view, setView] = useState<View>('month');
  const [weekStart, setWeekStart] = useState(() => formatDate(getWeekStart(parseISO(today))));
  const [month, setMonth] = useState(() => getMonthStr(today));
  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [cancelTarget, setCancelTarget] = useState<StudentBooking | ComputedSlot | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const minWeek = formatDate(getWeekStart(parseISO(today)));
  const maxWeek = formatDate(getWeekStart(addWeeks(parseISO(today), 4)));

  async function loadWeek(week: string) {
    setLoading(true);
    const emailParam = email ? `&studentEmail=${encodeURIComponent(email)}` : '';
    const res = await fetch(`/api/slots?week=${week}&teacherId=${teacherId}${emailParam}`);
    setSlots(res.ok ? await res.json() : []);
    setLoading(false);
  }

  async function loadMonth(monthStr: string) {
    setLoading(true);
    const emailParam = email ? `&studentEmail=${encodeURIComponent(email)}` : '';
    const weeks = getMonthWeekStarts(monthStr);
    const results = await Promise.all(
      weeks.map((w) => fetch(`/api/slots?week=${w}&teacherId=${teacherId}${emailParam}`).then((r) => r.json()))
    );
    setSlots(results.flat());
    setLoading(false);
  }

  async function loadBookings() {
    if (!email) return;
    const res = await fetch(`/api/student/bookings?email=${encodeURIComponent(email)}&teacherId=${teacherId}`);
    if (res.ok) setBookings(await res.json());
  }

  useEffect(() => {
    if (view === 'week') loadWeek(weekStart);
    else loadMonth(month);
  }, [view, weekStart, month]);

  useEffect(() => { loadBookings(); }, [email, teacherId]);

  async function submitCancelRequest() {
    if (!cancelTarget || !cancelReason.trim()) return;
    const bookingId = 'booking_id' in cancelTarget ? cancelTarget.booking_id : ('id' in cancelTarget ? (cancelTarget as StudentBooking).id : undefined);
    const bookingType = 'booking_type' in cancelTarget ? cancelTarget.booking_type : undefined;
    if (!bookingId || !bookingType) return;
    setCancelLoading(true);
    setCancelError('');
    const res = await fetch(`/api/student/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_type: bookingType, email, reason: cancelReason }),
    });
    setCancelLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setCancelError(d.error ?? 'Something went wrong');
      return;
    }
    setCancelTarget(null);
    setCancelReason('');
    loadBookings();
  }

  const weekStarts = view === 'week' ? [weekStart] : getMonthWeekStarts(month);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Lessons</h1>
            {email && <p className="text-xs text-gray-400 mt-0.5">{email}</p>}
          </div>
          {email && (
            <div className="flex rounded-xl border border-gray-200 bg-gray-50 overflow-hidden text-sm">
              <button
                onClick={() => setSection('schedule')}
                className={`px-4 py-2 font-medium transition-colors ${section === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Schedule
              </button>
              <button
                onClick={() => setSection('notebook')}
                className={`px-4 py-2 font-medium transition-colors ${section === 'notebook' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Notebook
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-5">

        {/* ── NOTEBOOK SECTION ── */}
        {section === 'notebook' && email && (
          <StudentNotebook teacherId={teacherId} email={email} />
        )}

        {/* ── SCHEDULE SECTION ── */}
        {section === 'schedule' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
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
                <div className="flex items-center gap-2">
                  <button onClick={() => setMonth(prevMonth(month))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8592;</button>
                  <span className="text-sm font-semibold text-gray-800 w-32 text-center">{formatMonthDisplay(month)}</span>
                  <button onClick={() => setMonth(nextMonth(month))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8594;</button>
                </div>
              )}

              {/* View toggle */}
              <div className="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-sm self-start sm:self-auto">
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
            </div>

            {loading ? (
              <div className="mt-8 text-center text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-4">
                {weekStarts.map((ws) => (
                  <div key={ws} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
                    <WeekCalendar
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
                      onOwnSlotClick={(slot) => { setCancelTarget(slot); setCancelReason(''); setCancelError(''); }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { color: 'bg-emerald-400', label: 'Available' },
                ...(email ? [
                  { color: 'bg-amber-400', label: 'Pending' },
                  { color: 'bg-blue-500',  label: 'Confirmed' },
                ] : []),
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>

            {/* My bookings */}
            {email && bookings.length > 0 && (
              <section className="mt-10">
                <h2 className="text-base font-semibold text-gray-900 mb-3">My Bookings</h2>
                <div className="space-y-2">
                  {bookings.map((b) => {
                    const label = b.booking_type === 'recurring'
                      ? `Every ${DAY_NAMES[b.day_of_week ?? 0]} · ${b.start_time}–${b.end_time}`
                      : `${b.specific_date} · ${b.start_time}–${b.end_time}`;
                    const isPending = b.status === 'cancellation_requested';
                    return (
                      <div key={`${b.id}-${b.is_group}`} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900">
                              {b.is_group ? b.group_name : label}
                            </p>
                            {b.is_group ? (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                Group · {b.booking_type === 'recurring' ? 'Recurring' : 'One-time'}
                              </span>
                            ) : (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                b.booking_type === 'recurring'
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-sky-100 text-sky-700'
                              }`}>
                                {b.booking_type === 'recurring' ? 'Recurring' : 'One-time'}
                              </span>
                            )}
                          </div>
                          {b.is_group && (
                            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                          )}
                          {isPending && (
                            <p className="text-xs text-amber-600 mt-0.5">Cancellation pending teacher approval</p>
                          )}
                        </div>
                        {!isPending && !b.is_group && (
                          <button
                            onClick={() => { setCancelTarget(b); setCancelReason(''); setCancelError(''); }}
                            className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap"
                          >
                            Request cancel
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Cancel modal */}
      {cancelTarget && (() => {
        const state = 'state' in cancelTarget ? cancelTarget.state : cancelTarget.status;
        const isPending = state === 'cancellation_requested';
        const isReadOnly = state === 'completed' || state === 'paid';
        const title = 'state' in cancelTarget
          ? `${(cancelTarget as ComputedSlot).date} · ${(cancelTarget as ComputedSlot).start_time}`
          : 'Lesson';
        return (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {isReadOnly ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                  This lesson has been {state === 'paid' ? 'paid' : 'completed'}.
                </div>
              ) : isPending ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                  Cancellation request already submitted and pending teacher approval.
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    Please provide a reason. Your teacher will review and approve the cancellation.
                  </p>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {cancelError && <p className="text-sm text-red-600">{cancelError}</p>}
                  <button
                    onClick={submitCancelRequest}
                    disabled={cancelLoading || !cancelReason.trim()}
                    className="w-full bg-red-600 text-white text-sm font-medium rounded-lg py-2 hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {cancelLoading ? 'Submitting...' : 'Submit request'}
                  </button>
                </>
              )}
              <button
                onClick={() => setCancelTarget(null)}
                className="w-full border border-gray-300 text-gray-600 text-sm rounded-lg py-2 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}
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
