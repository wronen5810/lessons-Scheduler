'use client';

import { addDays, format, parseISO, subDays } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import {
  DAY_NAMES_SHORT,
  formatDate, formatMonthDisplay, formatTimeDisplay,
  getMonthStr, getMonthWeekStarts, getWeekStart,
  nextMonth, prevMonth, todayInIsrael,
} from '@/lib/dates';
import type { CalendarEvent, CalendarEventType, ComputedSlot } from '@/lib/types';
import type { PendingRequest } from '@/app/api/teacher/requests/route';
import TeacherCalendar from '@/components/TeacherCalendar';
import SlotPanel from '@/components/SlotPanel';
import TeacherSettingsModal from '@/components/TeacherSettingsModal';
import { AddSlotWizard } from '@/components/QuickActionsWizard';
import EventCell from '@/components/EventCell';
import { useTeacherSettings } from '@/lib/useTeacherSettings';
import { useLanguage } from '@/contexts/LanguageContext';

type View = 'week' | 'month';

const DAY_STYLE: Record<string, { bar: string; border: string; badge: string }> = {
  available:              { bar: 'bg-sky-400',     border: 'border-sky-100',     badge: 'bg-sky-100 text-sky-700' },
  unavailable:            { bar: 'bg-gray-200',    border: 'border-gray-100',    badge: 'bg-gray-100 text-gray-400' },
  blocked:                { bar: 'bg-gray-400',    border: 'border-gray-200',    badge: 'bg-gray-200 text-gray-600' },
  pending:                { bar: 'bg-amber-400',   border: 'border-amber-100',   badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed:              { bar: 'bg-indigo-500',  border: 'border-indigo-100',  badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  completed:              { bar: 'bg-violet-500',  border: 'border-violet-100',  badge: 'bg-violet-50 text-violet-700' },
  paid:                   { bar: 'bg-emerald-500', border: 'border-emerald-100', badge: 'bg-emerald-50 text-emerald-700' },
  cancellation_requested: { bar: 'bg-rose-400',   border: 'border-rose-100',    badge: 'bg-rose-50 text-rose-600' },
};
const DAY_STYLE_DEFAULT = { bar: 'bg-gray-200', border: 'border-gray-100', badge: 'bg-gray-100 text-gray-400' };

const EVENT_TYPES: CalendarEventType[] = ['exam', 'task', 'paperwork', 'vacation', 'other'];

const HEBREW_GRADES: Record<number, string> = {
  1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו',
  7: 'ז', 8: 'ח', 9: 'ט', 10: 'י', 11: 'י"א', 12: 'י"ב',
};

export default function SchedulePage() {
  const { t, lang, isRTL } = useLanguage();
  const today = todayInIsrael();

  const [view, setView] = useState<View>('week');
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(() => getMonthStr(today));
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setView(window.innerWidth >= 1024 ? 'month' : 'week');
  }, []);

  const [addSlotDate, setAddSlotDate] = useState<string | null>(null);
  const [addForDate, setAddForDate] = useState<string | null>(null);
  const { settings, save: saveSettings } = useTeacherSettings();

  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ComputedSlot | null>(null);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingCollapsed, setPendingCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Events state ──────────────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEvents, setShowEvents] = useState(true);
  const [viewAsStudent, setViewAsStudent] = useState<{ id: string; name: string; email: string } | null>(null);
  const [addEventDate, setAddEventDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [allStudents, setAllStudents] = useState<{ id: string; name: string; email: string; grade: number | null }[]>([]);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState('');
  // Event form
  const [evType, setEvType] = useState<CalendarEventType>('exam');
  const [evDate, setEvDate] = useState('');
  const [evTime, setEvTime] = useState('');
  const [evEndDate, setEvEndDate] = useState('');
  const [evEndTime, setEvEndTime] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evAssignMode, setEvAssignMode] = useState<'none' | 'students' | 'grade'>('none');
  const [evStudentIds, setEvStudentIds] = useState<string[]>([]);
  const [evGrade, setEvGrade] = useState<number | null>(null);
  const [evReminder, setEvReminder] = useState(false);
  const [evReminderDays, setEvReminderDays] = useState(1);
  const [evReminderEmail, setEvReminderEmail] = useState(true);
  const [evReminderWhatsapp, setEvReminderWhatsapp] = useState(false);
  const [evReminderPush, setEvReminderPush] = useState(false);

  // Touch swipe support
  const touchStartXRef = useRef<number | null>(null);

  function weekForDate(date: string) {
    return formatDate(getWeekStart(parseISO(date)));
  }

  // Week navigation helpers
  const weekStartDate = parseISO(weekForDate(selectedDate));
  const weekEndDate = addDays(weekStartDate, 6);
  const isCurrentWeek = weekForDate(selectedDate) === weekForDate(today);
  const weekLabel = weekStartDate.getMonth() === weekEndDate.getMonth()
    ? `${format(weekStartDate, 'MMM d')} – ${format(weekEndDate, 'd')}`
    : `${format(weekStartDate, 'MMM d')} – ${format(weekEndDate, 'MMM d')}`;

  function prevWeek() { setSelectedDate(formatDate(subDays(weekStartDate, 7))); }
  function nextWeek() { setSelectedDate(formatDate(addDays(weekStartDate, 7))); }
  function goToToday() { setSelectedDate(today); }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(dx) < 60) return;
    dx < 0 ? nextWeek() : prevWeek();
  }

  async function loadEvents(from: string, to: string) {
    const res = await fetch(`/api/teacher/events?from=${from}&to=${to}`);
    if (res.ok) setEvents(await res.json());
  }

  async function loadWeek(week: string) {
    setLoading(true);
    const [slotsRes] = await Promise.all([
      fetch(`/api/teacher/slots?week=${week}`),
      loadEvents(week, formatDate(addDays(parseISO(week), 6))),
    ]);
    setSlots(slotsRes.ok ? await slotsRes.json() : []);
    setLoading(false);
  }

  async function loadMonth(monthStr: string) {
    setLoading(true);
    const weeks = getMonthWeekStarts(monthStr);
    const from = weeks[0];
    const to = formatDate(addDays(parseISO(weeks[weeks.length - 1]), 6));
    const [slotsRes] = await Promise.all([
      fetch(`/api/teacher/slots/month?month=${monthStr}`),
      loadEvents(from, to),
    ]);
    setSlots(slotsRes.ok ? await slotsRes.json() : []);
    setLoading(false);
  }

  function reload() {
    if (view === 'week') loadWeek(weekForDate(selectedDate));
    else loadMonth(month);
  }

  useEffect(() => { reload(); }, [view, selectedDate, month]);

  // Load students list for event assignment
  useEffect(() => {
    fetch('/api/teacher/students')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllStudents(data.filter((s: { is_active: boolean }) => s.is_active));
      })
      .catch(() => {});
  }, []);

  async function loadRequests() {
    setRequestsLoading(true);
    const res = await fetch('/api/teacher/requests');
    setRequests(res.ok ? await res.json() : []);
    setRequestsLoading(false);
  }

  useEffect(() => { loadRequests(); }, []);

  // Auto-dismiss toast after 3 s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadRequests(), reload()]);
    setRefreshing(false);
  }

  async function handleAddStudent(req: PendingRequest) {
    setActionLoading(req.id);
    await fetch('/api/teacher/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: req.student_name, email: req.student_email, phone: req.student_phone ?? null }),
    });
    await fetch(`/api/student-access-request/${req.id}`, { method: 'DELETE' });
    setActionLoading(null);
    loadRequests();
    setToast(t('common.actionApproved'));
  }

  async function handleRequestAction(req: PendingRequest, action: 'approve' | 'reject' | 'approve-cancellation' | 'dismiss') {
    setActionLoading(req.id);
    if (action === 'dismiss') {
      await fetch(`/api/student-access-request/${req.id}`, { method: 'DELETE' });
    } else {
      await fetch(`/api/bookings/${req.id}?type=${req.booking_type}&action=${action}`, { method: 'PATCH' });
    }
    setActionLoading(null);
    loadRequests();
    reload();
    const toastMsg =
      action === 'approve' || action === 'approve-cancellation' ? t('common.actionApproved') :
      action === 'reject' ? t('common.actionRejected') :
      t('common.actionDismissed');
    setToast(toastMsg);
  }

  function handleAction() {
    setSelected(null);
    loadRequests();
    reload();
  }

  // ── Event CRUD ────────────────────────────────────────────────────
  function openAddEvent(date: string) {
    setEvType('exam'); setEvDate(date); setEvTime(''); setEvEndDate(date); setEvEndTime(''); setEvDesc('');
    setEvAssignMode('none'); setEvStudentIds([]); setEvGrade(null);
    setEvReminder(false); setEvReminderDays(1); setEvReminderEmail(true);
    setEvReminderWhatsapp(false); setEvReminderPush(false);
    setEventError('');
    setAddEventDate(date);
  }

  async function saveEvent() {
    if (!evDesc.trim() || !evDate) { setEventError(isRTL ? 'נדרש תיאור ותאריך' : 'Description and date are required'); return; }
    const endDate = evEndDate && evEndDate >= evDate ? evEndDate : null;
    setEventSaving(true);
    setEventError('');
    const body: Record<string, unknown> = {
      event_type: evType,
      description: evDesc.trim(),
      event_date: evDate,
      event_time: evTime || null,
      event_end_date: endDate,
      event_end_time: endDate ? (evEndTime || null) : null,
    };
    if (evAssignMode === 'students') body.student_ids = evStudentIds;
    if (evAssignMode === 'grade' && evGrade) body.grade = evGrade;
    if (evReminder) {
      body.reminder_days = evReminderDays;
      body.reminder_channels = { email: evReminderEmail, whatsapp: evReminderWhatsapp, push: evReminderPush };
    }
    const res = await fetch('/api/teacher/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setEventSaving(false);
    if (!res.ok) { const d = await res.json(); setEventError(d.error ?? 'Error'); return; }
    setAddEventDate(null);
    reload();
  }

  async function deleteEvent(id: string) {
    if (!confirm(t('events.deleteConfirm'))) return;
    await fetch(`/api/teacher/events/${id}`, { method: 'DELETE' });
    setEditingEvent(null);
    reload();
  }

  // ── Computed filtered data for "View as student" ──────────────────
  const filteredSlots = viewAsStudent
    ? slots.filter((s) =>
        s.state === 'available' ||
        s.student_email === viewAsStudent.email
      )
    : slots;

  const filteredEvents = viewAsStudent
    ? events.filter((e) =>
        e.student_id === viewAsStudent.id ||
        (e.calendar_event_students ?? []).some((es) => es.student_id === viewAsStudent.id)
      )
    : events;

  // ── Week view helpers ────────────────────────────────────────────────────
  const dayStripDates = Array.from({ length: 7 }, (_, i) =>
    formatDate(addDays(weekStartDate, i))
  );
  const daySlots = filteredSlots
    .filter((s) => s.date === selectedDate && s.state !== 'unavailable')
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const dayEvents = showEvents ? filteredEvents.filter((e) => e.event_date <= selectedDate && (e.event_end_date ?? e.event_date) >= selectedDate) : [];

  function slotLabel(slot: ComputedSlot): string {
    if (slot.group_name) return slot.group_name;
    if (slot.student_name) return slot.student_name;
    if (slot.title) return slot.title ?? '';
    if (slot.state === 'blocked') return t('slot.blocked');
    return t('slot.open');
  }

  function statusLabel(state: string): string {
    const map: Record<string, string> = {
      available: t('slot.available'), blocked: t('slot.blocked'), pending: t('slot.pending'),
      confirmed: t('slot.approved'), completed: t('slot.completed'), paid: t('slot.paid'),
      cancellation_requested: t('slot.cancelReq'),
    };
    return map[state] ?? state;
  }

  function gradeLabel(g: number) {
    return lang === 'he' ? (HEBREW_GRADES[g] ?? String(g)) : String(g);
  }

  return (
    <>
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 pb-5" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* "View as student" banner */}
        {viewAsStudent && (
          <div className="mb-3 flex items-center justify-between bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium">
            <span>👁 {t('events.viewAsStudent')}: <strong>{viewAsStudent.name}</strong></span>
            <button onClick={() => setViewAsStudent(null)} className="text-blue-200 hover:text-white text-lg leading-none">×</button>
          </div>
        )}

        {/* Navigation row */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          {/* Left: week or month navigation */}
          {view === 'week' ? (
            <div className="flex items-center gap-1">
              <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8592;</button>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-800 tabular-nums min-w-[120px] text-center">{weekLabel}</span>
                {!isCurrentWeek && (
                  <button onClick={goToToday} className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors">
                    {t('common.home')}
                  </button>
                )}
              </div>
              <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8594;</button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => setMonth(prevMonth(month))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8592;</button>
              <span className="text-sm font-semibold text-gray-800 w-32 text-center">{formatMonthDisplay(month)}</span>
              <button onClick={() => setMonth(nextMonth(month))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8594;</button>
            </div>
          )}

          {/* Center: hint text (month view only) */}
          {view === 'month' && (
            <span className="hidden sm:block text-xs text-gray-400 italic">
              {isRTL ? 'בחר תאריך להוספת שיעור / אירוע' : 'Pick a date to add a slot / event'}
            </span>
          )}

          {/* Right: controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Events toggle */}
            <button
              onClick={() => setShowEvents((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                showEvents
                  ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
              title={t('events.showEvents')}
            >
              📅 {t('events.showEvents')}
              {showEvents && <span className="text-orange-500">✓</span>}
            </button>

            {/* View as student */}
            <select
              value={viewAsStudent?.id ?? ''}
              onChange={(e) => {
                if (!e.target.value) { setViewAsStudent(null); return; }
                const s = allStudents.find((st) => st.id === e.target.value);
                if (s) setViewAsStudent({ id: s.id, name: s.name, email: s.email });
              }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 bg-white hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">{t('events.viewAsStudent')}</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Week/Month toggle */}
            <div className="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-sm">
              <button onClick={() => setView('week')} className={`px-3 py-1.5 font-medium transition-colors ${view === 'week' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {t('common.week')}
              </button>
              <button onClick={() => setView('month')} className={`px-3 py-1.5 font-medium transition-colors ${view === 'month' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {t('common.month')}
              </button>
            </div>
            <button onClick={handleRefresh} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors" title={t('common.refresh')}>
              <span className={`inline-block text-base ${refreshing ? 'animate-spin' : ''}`}>↺</span>
            </button>
          </div>
        </div>

        {/* Pending requests panel */}
        {!requestsLoading && requests.length > 0 && (
          <div className="mb-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setPendingCollapsed(c => !c)}
              className="w-full px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                {t('teacher.pendingRequests')}
                <span className="bg-amber-100 text-amber-700 text-xs font-medium px-1.5 py-0.5 rounded-full">{requests.length}</span>
              </h2>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${pendingCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {!pendingCollapsed && (
              <div className="divide-y divide-gray-100">
                {requests.map((req) => {
                  const isAccess = req.request_type === 'access_request';
                  const isCancel = req.request_type === 'cancellation_request';
                  const isRecurring = req.booking_type === 'recurring';
                  const busy = actionLoading === req.id;
                  return (
                    <div key={req.id} className="px-4 py-3 flex items-start gap-4">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${isAccess ? 'bg-violet-400' : isCancel ? 'bg-orange-400' : 'bg-amber-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{req.student_name}</span>
                          <span className="text-xs text-gray-500">{req.student_email}</span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isAccess ? 'bg-violet-100 text-violet-700' : isCancel ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isAccess ? t('teacher.accessRequest') : isCancel ? t('teacher.cancelRequest') : t('teacher.lessonRequest')}
                          </span>
                        </div>
                        {isAccess ? (
                          <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                            {req.student_phone && <div>📞 {req.student_phone}</div>}
                            {req.student_note && <div className="italic">&ldquo;{req.student_note}&rdquo;</div>}
                            {!req.student_phone && !req.student_note && <div>{t('teacher.notInList')}</div>}
                          </div>
                        ) : (
                          <>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {req.date} &middot; {req.start_time}–{req.end_time}
                              {isRecurring && !isCancel && (req.series_id ? ` · ${t('teacher.recurringSeries')}` : ` · ${t('teacher.recurring')}`)}
                            </div>
                            {isCancel && req.cancellation_reason && (
                              <div className="text-xs text-gray-500 mt-0.5 italic">&ldquo;{req.cancellation_reason}&rdquo;</div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {isAccess ? (
                          <>
                            <button onClick={() => handleAddStudent(req)} disabled={busy}
                              className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors">
                              {t('teacher.addStudent')}
                            </button>
                            <button onClick={() => handleRequestAction(req, 'dismiss')} disabled={busy}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                              {t('common.dismiss')}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleRequestAction(req, isCancel ? 'approve-cancellation' : 'approve')} disabled={busy}
                              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                              {t('common.approve')}
                            </button>
                            <button onClick={() => handleRequestAction(req, isCancel ? 'approve' : 'reject')} disabled={busy}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                              {isCancel ? t('common.deny') : t('common.reject')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── WEEK VIEW ── */}
        {view === 'week' && (
          <div className="space-y-3" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {/* ── Desktop: 7-column week grid (sm+) ── */}
            <div className="hidden sm:block">
              <div className="relative">
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  {dayStripDates.map((date) => {
                    const d = parseISO(date);
                    const isT = date === today;
                    const colSlots = filteredSlots
                      .filter((s) => s.date === date && s.state !== 'unavailable')
                      .sort((a, b) => a.start_time.localeCompare(b.start_time));
                    const colEvents = showEvents ? filteredEvents.filter((e) => e.event_date <= date && (e.event_end_date ?? e.event_date) >= date) : [];

                    return (
                      <div key={date} className="flex flex-col bg-white min-h-[200px]">
                        {/* Column header */}
                        <div className={`text-center px-1 pt-2.5 pb-2 border-b border-gray-100 ${isT ? 'bg-blue-50' : 'bg-gray-50/50'}`}>
                          <div className={`text-[10px] font-semibold uppercase tracking-wider ${isT ? 'text-blue-600' : 'text-gray-400'}`}>
                            {DAY_NAMES_SHORT[d.getDay()]}
                          </div>
                          <div className={`w-7 h-7 mx-auto mt-0.5 flex items-center justify-center rounded-full text-sm font-bold ${isT ? 'bg-blue-600 text-white' : 'text-gray-800'}`}>
                            {format(d, 'd')}
                          </div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <button onClick={() => setAddForDate(date)} className="text-base font-bold text-gray-400 hover:text-blue-500 transition-colors leading-none" title="Add">+</button>
                          </div>
                        </div>

                        {/* Slots + events */}
                        <div className="flex-1 p-1 space-y-1 overflow-y-auto max-h-72">
                          {colSlots.map((slot) => {
                            const style = DAY_STYLE[slot.state] ?? DAY_STYLE_DEFAULT;
                            return (
                              <button key={`${slot.date}-${slot.start_time}`}
                                onClick={() => { setSelected(slot); setSelectedDate(date); }}
                                className={`w-full text-left rounded-lg border ${style.border} bg-white px-1.5 py-1.5 hover:shadow-sm hover:scale-[1.02] active:scale-[0.99] transition-all`}
                              >
                                <div className="flex items-start gap-1">
                                  <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${style.bar} mt-0.5`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[10px] font-semibold text-gray-500 tabular-nums">{formatTimeDisplay(slot.start_time, settings.time_format)}</div>
                                    <div className="text-[11px] font-medium text-gray-800 truncate leading-tight mt-0.5">{slotLabel(slot)}</div>
                                    <span className={`text-[9px] px-1 py-0.5 rounded-full font-medium ${style.badge} inline-block mt-0.5`}>{statusLabel(slot.state)}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          {colEvents.map((ev) => (
                            <EventCell key={ev.id} event={ev} compact onClick={() => setEditingEvent(ev)} />
                          ))}
                          {colSlots.length === 0 && colEvents.length === 0 && (
                            <button onClick={() => setAddForDate(date)}
                              className="w-full py-6 flex items-center justify-center text-gray-300 hover:text-blue-400 transition-colors text-4xl font-bold"
                              title="Add">+</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {loading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* ── Mobile: day strip + selected day slots ── */}
            <div className="sm:hidden">
              <div className="flex gap-1 pb-1">
                {dayStripDates.map((date) => {
                  const d = parseISO(date);
                  const isSelected = date === selectedDate;
                  const isT = date === today;
                  const hasContent = filteredSlots.some((s) => s.date === date && s.state !== 'unavailable')
                    || (showEvents && filteredEvents.some((e) => e.event_date <= date && (e.event_end_date ?? e.event_date) >= date));
                  return (
                    <div key={date} onClick={() => setSelectedDate(date)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all cursor-pointer ${
                        isSelected ? 'bg-blue-600 text-white shadow-md' : isT ? 'bg-blue-50 text-blue-700 border-2 border-blue-500' : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <span className={`text-[9px] font-semibold uppercase tracking-wide ${isSelected ? 'text-blue-100' : isT ? 'text-blue-600' : 'text-gray-400'}`}>
                        {DAY_NAMES_SHORT[d.getDay()]}
                      </span>
                      <span className="text-sm font-bold">{format(d, 'd')}</span>
                      {hasContent ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-200' : 'bg-blue-400'}`} />
                      ) : (
                        <span className="w-1.5 h-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {loading ? (
                <div className="text-center py-10 text-gray-400">{t('common.loading')}</div>
              ) : daySlots.length === 0 && dayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <span className="text-4xl">📭</span>
                  <p className="text-sm text-gray-400">{t('teacher.noLessonsDay')}</p>
                  <button onClick={() => setAddForDate(selectedDate)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                    + {t('schedule.addSlot')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {daySlots.map((slot) => {
                    const style = DAY_STYLE[slot.state] ?? DAY_STYLE_DEFAULT;
                    const name = slotLabel(slot);
                    const isGroup = !!slot.group_name;
                    return (
                      <div key={`${slot.date}-${slot.start_time}`} onClick={() => setSelected(slot)}
                        className={`bg-white rounded-2xl border ${style.border} shadow-sm px-4 py-3 flex items-center gap-3 cursor-pointer hover:shadow-md active:scale-[0.99] transition-all`}
                      >
                        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${style.bar}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 font-medium">{formatTimeDisplay(slot.start_time, settings.time_format)}–{formatTimeDisplay(slot.end_time, settings.time_format)}</p>
                          <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.badge}`}>{statusLabel(slot.state)}</span>
                            {slot.booking_type && <span className="text-[10px] text-gray-400">{slot.booking_type === 'one_time' ? '1×' : '↺'}</span>}
                            {isGroup && slot.group_member_count != null && <span className="text-[10px] text-gray-400">{slot.group_member_count} students</span>}
                            {!isGroup && slot.max_participants != null && slot.max_participants > 1 && <span className="text-[10px] text-gray-400">{slot.participant_count ?? 0}/{slot.max_participants}</span>}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    );
                  })}
                  {dayEvents.map((ev) => (
                    <EventCell key={ev.id} event={ev} onClick={() => setEditingEvent(ev)} />
                  ))}
                  <button onClick={() => setAddForDate(selectedDate)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-medium hover:border-blue-300 hover:text-blue-500 transition-colors">
                    + {t('schedule.addSlot')}
                  </button>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 pt-1">
              {([
                { color: 'bg-sky-400',     key: 'slot.open' },
                { color: 'bg-gray-400',    key: 'slot.blocked' },
                { color: 'bg-amber-400',   key: 'slot.pending' },
                { color: 'bg-indigo-500',  key: 'slot.approved' },
                { color: 'bg-violet-500',  key: 'slot.completed' },
                { color: 'bg-emerald-500', key: 'slot.paid' },
                { color: 'bg-rose-400',    key: 'slot.cancelReq' },
              ] as const).map(({ color, key }) => (
                <span key={key} className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  {t(key)}
                </span>
              ))}
              {showEvents && (
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-orange-300" />
                  {t('events.showEvents')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {view === 'month' && (
          <>
            {slots.length === 0 && loading ? (
              <div className="mt-8 text-center text-gray-400">{t('common.loading')}</div>
            ) : (
              <div className="relative">
                <TeacherCalendar
                  slots={filteredSlots}
                  weekStarts={getMonthWeekStarts(month)}
                  today={today}
                  onSelectSlot={(slot) => { setSelected(slot); setSelectedDate(slot.date); }}
                  onAddDate={setAddForDate}
                  timeFormat={settings.time_format}
                  events={filteredEvents}
                  showEvents={showEvents}
                  onSelectEvent={setEditingEvent}
                />
                {loading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {([
                { color: 'bg-sky-400',     key: 'slot.open' },
                { color: 'bg-gray-400',    key: 'slot.blocked' },
                { color: 'bg-amber-400',   key: 'slot.pending' },
                { color: 'bg-indigo-500',  key: 'slot.approved' },
                { color: 'bg-violet-500',  key: 'slot.completed' },
                { color: 'bg-emerald-500', key: 'slot.paid' },
                { color: 'bg-rose-400',    key: 'slot.cancelReq' },
              ] as const).map(({ color, key }) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  {t(key)}
                </span>
              ))}
              {showEvents && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-orange-200 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-orange-300" />
                  {t('events.showEvents')}
                </span>
              )}
            </div>
          </>
        )}

      </main>

      {selected && (
        <SlotPanel slot={selected} onClose={() => setSelected(null)} onAction={handleAction} timeFormat={settings.time_format} />
      )}

      {showSettings && (
        <TeacherSettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}

      {addForDate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={() => setAddForDate(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-700 text-center">{addForDate}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setAddSlotDate(addForDate); setAddForDate(null); }}
                className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + {t('schedule.addSlot')}
              </button>
              <button
                onClick={() => { openAddEvent(addForDate); setAddForDate(null); }}
                className="flex-1 bg-orange-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                📅 {t('events.addEvent')}
              </button>
            </div>
            <button onClick={() => setAddForDate(null)} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {addSlotDate && (
        <AddSlotWizard initialDate={addSlotDate} onClose={() => setAddSlotDate(null)} onDone={() => { setAddSlotDate(null); reload(); }} />
      )}

      {/* Add Event Modal */}
      {addEventDate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={() => setAddEventDate(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900">{t('events.addEvent')}</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('events.eventType')}</label>
              <select value={evType} onChange={(e) => setEvType(e.target.value as CalendarEventType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {EVENT_TYPES.map((et) => (
                  <option key={et} value={et}>{t(`events.${et}` as Parameters<typeof t>[0])}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('events.description')}</label>
              <input type="text" value={evDesc} onChange={(e) => setEvDesc(e.target.value)} autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Start */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{isRTL ? 'תאריך התחלה' : 'Start date'}</label>
                <input type="date" value={evDate}
                  onChange={(e) => { setEvDate(e.target.value); if (!evEndDate || e.target.value > evEndDate) setEvEndDate(e.target.value); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{isRTL ? 'שעת התחלה' : 'Start time'}</label>
                <input type="time" value={evTime} onChange={(e) => setEvTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
              </div>
            </div>

            {/* End */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{isRTL ? 'תאריך סיום' : 'End date'}</label>
                <input type="date" value={evEndDate} min={evDate}
                  onChange={(e) => setEvEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{isRTL ? 'שעת סיום' : 'End time'}</label>
                <input type="time" value={evEndTime} onChange={(e) => setEvEndTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
              </div>
            </div>

            {/* Student assignment */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">{t('events.assignStudents')}</label>
              <div className="space-y-1.5">
                {(['none', 'students', 'grade'] as const).map((mode) => (
                  <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="evAssign" checked={evAssignMode === mode} onChange={() => setEvAssignMode(mode)} />
                    <span className="text-gray-700">
                      {mode === 'none' ? (isRTL ? 'ללא תלמידים' : 'No students (teacher-only)') :
                       mode === 'students' ? (isRTL ? 'תלמידים ספציפיים' : 'Specific students') :
                       t('events.assignGrade')}
                    </span>
                  </label>
                ))}
              </div>
              {evAssignMode === 'students' && (
                <div className="mt-2 max-h-36 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {allStudents.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={evStudentIds.includes(s.id)}
                        onChange={() => setEvStudentIds((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id])} />
                      <span className="text-gray-800">{s.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {evAssignMode === 'grade' && (
                <select value={evGrade ?? ''} onChange={(e) => setEvGrade(e.target.value ? Number(e.target.value) : null)}
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">{isRTL ? 'בחר כיתה' : 'Select grade'}</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g}>{gradeLabel(g)}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Reminder */}
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={evReminder} onChange={(e) => setEvReminder(e.target.checked)} />
                <span className="font-medium text-gray-700">{t('events.reminder')}</span>
              </label>
              {evReminder && (
                <div className="mt-2 space-y-2 ps-5">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="number" min={1} max={30} value={evReminderDays}
                      onChange={(e) => setEvReminderDays(Number(e.target.value))}
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span>{t('events.reminderDays')}</span>
                  </div>
                  <div className="flex gap-3 text-sm text-gray-700">
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={evReminderEmail} onChange={(e) => setEvReminderEmail(e.target.checked)} /> Email</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={evReminderWhatsapp} onChange={(e) => setEvReminderWhatsapp(e.target.checked)} /> WhatsApp</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={evReminderPush} onChange={(e) => setEvReminderPush(e.target.checked)} /> Push</label>
                  </div>
                </div>
              )}
            </div>

            {eventError && <p className="text-sm text-red-600">{eventError}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={saveEvent} disabled={eventSaving}
                className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
                {eventSaving ? t('common.saving') : t('common.save')}
              </button>
              <button onClick={() => setAddEventDate(null)}
                className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail / Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={() => setEditingEvent(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t(`events.${editingEvent.event_type}` as Parameters<typeof t>[0])}</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{editingEvent.description}</p>
              </div>
              <button onClick={() => setEditingEvent(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none flex-shrink-0">×</button>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📅 {editingEvent.event_date}{editingEvent.event_time ? ` ${editingEvent.event_time.slice(0, 5)}` : ''}
                {editingEvent.event_end_date && editingEvent.event_end_date !== editingEvent.event_date
                  ? ` → ${editingEvent.event_end_date}${editingEvent.event_end_time ? ` ${editingEvent.event_end_time.slice(0, 5)}` : ''}`
                  : (editingEvent.event_end_time ? ` → ${editingEvent.event_end_time.slice(0, 5)}` : '')}
              </p>
              {editingEvent.created_by === 'student' && (
                <p className="text-xs text-indigo-600 font-medium">{t('events.createdByStudent')}{editingEvent.student_name ? `: ${editingEvent.student_name}` : ''}</p>
              )}
              {editingEvent.reminder_days != null && (
                <p className="text-xs text-gray-400">🔔 {editingEvent.reminder_days} {t('events.reminderDays')}</p>
              )}
              {(editingEvent.calendar_event_students?.length ?? 0) > 0 && (
                <p className="text-xs text-gray-500">
                  👥 {editingEvent.calendar_event_students?.map((es) => es.students.name).join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={() => deleteEvent(editingEvent.id)}
              className="w-full py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
              🗑 {t('common.delete')}
            </button>
          </div>
        </div>
      )}

      {/* Action toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white transition-colors text-base leading-none">×</button>
        </div>
      )}
    </>
  );
}
