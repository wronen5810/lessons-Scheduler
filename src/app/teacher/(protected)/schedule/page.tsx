'use client';

import { addDays, format, parseISO, subDays } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  DAY_NAMES, DAY_NAMES_SHORT,
  formatDate, formatMonthDisplay, formatTimeDisplay,
  getMonthStr, getMonthWeekStarts, getWeekStart,
  nextMonth, prevMonth, todayInIsrael,
} from '@/lib/dates';
import { DAY_NAMES_HE } from '@/lib/i18n';
import type { ComputedSlot } from '@/lib/types';
import type { PendingRequest } from '@/app/api/teacher/requests/route';
import TeacherCalendar from '@/components/TeacherCalendar';
import SlotPanel from '@/components/SlotPanel';
import TeacherSettingsModal from '@/components/TeacherSettingsModal';
import AddSlotModal from '@/components/AddSlotModal';
import { useTeacherSettings } from '@/lib/useTeacherSettings';
import { useLanguage } from '@/contexts/LanguageContext';

type View = 'day' | 'month';

const DAY_STYLE: Record<string, { bar: string; border: string; badge: string }> = {
  available:              { bar: 'bg-slate-300',   border: 'border-gray-100',    badge: 'bg-slate-100 text-slate-600' },
  unavailable:            { bar: 'bg-gray-200',    border: 'border-gray-100',    badge: 'bg-gray-100 text-gray-400' },
  blocked:                { bar: 'bg-gray-400',    border: 'border-gray-200',    badge: 'bg-gray-200 text-gray-600' },
  pending:                { bar: 'bg-amber-400',   border: 'border-amber-100',   badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed:              { bar: 'bg-indigo-500',  border: 'border-indigo-100',  badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  completed:              { bar: 'bg-violet-500',  border: 'border-violet-100',  badge: 'bg-violet-50 text-violet-700' },
  paid:                   { bar: 'bg-emerald-500', border: 'border-emerald-100', badge: 'bg-emerald-50 text-emerald-700' },
  cancellation_requested: { bar: 'bg-rose-400',   border: 'border-rose-100',    badge: 'bg-rose-50 text-rose-600' },
};
const DAY_STYLE_DEFAULT = { bar: 'bg-gray-200', border: 'border-gray-100', badge: 'bg-gray-100 text-gray-400' };

export default function SchedulePage() {
  const { t, lang } = useLanguage();
  const today = todayInIsrael();

  const [view, setView] = useState<View>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'month' : 'day'
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(() => getMonthStr(today));
  const [showSettings, setShowSettings] = useState(false);
  const [addSlotDate, setAddSlotDate] = useState<string | null>(null);
  const { settings, save: saveSettings } = useTeacherSettings();

  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ComputedSlot | null>(null);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function weekForDate(date: string) {
    return formatDate(getWeekStart(parseISO(date)));
  }

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

  function reload() {
    if (view === 'day') loadWeek(weekForDate(selectedDate));
    else loadMonth(month);
  }

  useEffect(() => { reload(); }, [view, selectedDate, month]);

  async function loadRequests() {
    setRequestsLoading(true);
    const res = await fetch('/api/teacher/requests');
    setRequests(res.ok ? await res.json() : []);
    setRequestsLoading(false);
  }

  useEffect(() => { loadRequests(); }, []);

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
  }

  function handleAction() {
    setSelected(null);
    loadRequests();
    reload();
  }

  // ── Day view helpers ────────────────────────────────────────────────
  const dayNames = lang === 'he' ? DAY_NAMES_HE : DAY_NAMES;
  const dayStripDates = Array.from({ length: 7 }, (_, i) =>
    formatDate(addDays(parseISO(weekForDate(selectedDate)), i))
  );
  const daySlots = slots
    .filter((s) => s.date === selectedDate && s.state !== 'unavailable')
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

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

  const selectedDateObj = parseISO(selectedDate);
  const dayHeader = `${dayNames[selectedDateObj.getDay()]}, ${format(selectedDateObj, 'MMM d')}`;
  const isToday = selectedDate === today;

  return (
    <>
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 pb-5">

        {/* Navigation row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Left: date/month navigation */}
          {view === 'day' ? (
            <div className="flex items-center gap-1">
              <button onClick={() => setSelectedDate(formatDate(subDays(selectedDateObj, 1)))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8592;</button>
              <button
                onClick={() => setSelectedDate(today)}
                className={`text-sm font-semibold px-3 py-1 rounded-lg transition-colors ${isToday ? 'text-indigo-600' : 'text-gray-800 hover:bg-white hover:shadow-sm'}`}
              >
                {isToday ? `${dayHeader} ·` : dayHeader} {isToday && <span className="text-xs font-medium">{t('common.home').toLowerCase()}</span>}
              </button>
              <button onClick={() => setSelectedDate(formatDate(addDays(selectedDateObj, 1)))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8594;</button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => setMonth(prevMonth(month))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8592;</button>
              <span className="text-sm font-semibold text-gray-800 w-28 text-center">{formatMonthDisplay(month)}</span>
              <button onClick={() => setMonth(nextMonth(month))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 transition-all">&#8594;</button>
            </div>
          )}

          {/* Right: view toggle + refresh + settings */}
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-sm">
              <button onClick={() => setView('day')} className={`px-3 py-1.5 font-medium transition-colors ${view === 'day' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {t('common.day')}
              </button>
              <button onClick={() => setView('month')} className={`px-3 py-1.5 font-medium transition-colors ${view === 'month' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {t('common.month')}
              </button>
            </div>
            <button onClick={() => { loadRequests(); reload(); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={t('common.refresh')}>↺</button>
            <button onClick={() => setShowSettings(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={t('common.settings')}>⚙</button>
          </div>
        </div>

        {/* Pending requests panel */}
        {!requestsLoading && requests.length > 0 && (
          <div className="mb-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">
                {t('teacher.pendingRequests')} <span className="ml-1.5 bg-red-100 text-red-700 text-xs font-medium px-1.5 py-0.5 rounded-full">{requests.length}</span>
              </h2>
            </div>
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
          </div>
        )}

        {/* ── DAY VIEW ── */}
        {view === 'day' && (
          <div className="space-y-3">
            {/* Day strip */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {dayStripDates.map((date) => {
                const d = parseISO(date);
                const isSelected = date === selectedDate;
                const isT = date === today;
                const hasSlots = slots.some((s) => s.date === date && s.state !== 'unavailable');
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : isT
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                      {DAY_NAMES_SHORT[d.getDay()]}
                    </span>
                    <span className="text-sm font-bold">{format(d, 'd')}</span>
                    {hasSlots && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-200' : 'bg-blue-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Slot list */}
            {loading ? (
              <div className="text-center py-10 text-gray-400">{t('common.loading')}</div>
            ) : daySlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-4xl">📭</span>
                <p className="text-sm text-gray-400">{t('teacher.noLessonsDay')}</p>
                <button
                  onClick={() => setAddSlotDate(selectedDate)}
                  className="mt-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  + {t('common.add')} slot
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {daySlots.map((slot) => {
                  const style = DAY_STYLE[slot.state] ?? DAY_STYLE_DEFAULT;
                  const isClickable = slot.state !== 'unavailable';
                  const name = slotLabel(slot);
                  const isGroup = !!slot.group_name;
                  return (
                    <div
                      key={`${slot.date}-${slot.start_time}`}
                      onClick={isClickable ? () => setSelected(slot) : undefined}
                      className={`bg-white rounded-2xl border ${style.border} shadow-sm px-4 py-3 flex items-center gap-3 transition-all ${
                        isClickable ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : 'cursor-default'
                      }`}
                    >
                      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${style.bar}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 font-medium">
                          {formatTimeDisplay(slot.start_time, settings.time_format)}–{formatTimeDisplay(slot.end_time, settings.time_format)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.badge}`}>
                            {statusLabel(slot.state)}
                          </span>
                          {slot.booking_type && (
                            <span className="text-[10px] text-gray-400">
                              {slot.booking_type === 'one_time' ? '1×' : '↺'}
                            </span>
                          )}
                          {isGroup && slot.group_member_count != null && (
                            <span className="text-[10px] text-gray-400">{slot.group_member_count} students</span>
                          )}
                          {!isGroup && slot.max_participants != null && slot.max_participants > 1 && (
                            <span className="text-[10px] text-gray-400">{slot.participant_count ?? 0}/{slot.max_participants}</span>
                          )}
                        </div>
                      </div>
                      {isClickable && (
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  );
                })}

                {/* Add slot button */}
                <button
                  onClick={() => setAddSlotDate(selectedDate)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-medium hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  + {t('common.add')} slot
                </button>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-2 pt-1">
              {([
                { color: 'bg-slate-300',   key: 'slot.open' },
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
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {view === 'month' && (
          <>
            {loading ? (
              <div className="mt-8 text-center text-gray-400">{t('common.loading')}</div>
            ) : (
              <TeacherCalendar
                slots={slots}
                weekStarts={getMonthWeekStarts(month)}
                today={today}
                onSelectSlot={(slot) => {
                  setSelected(slot);
                  setSelectedDate(slot.date);
                }}
                onAddSlot={(date) => setAddSlotDate(date)}
                timeFormat={settings.time_format}
              />
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {([
                { color: 'bg-slate-400',   key: 'slot.open' },
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

      {addSlotDate && (
        <AddSlotModal
          date={addSlotDate}
          defaultDuration={settings.default_duration_minutes}
          timeFormat={settings.time_format}
          onClose={() => setAddSlotDate(null)}
          onSaved={reload}
        />
      )}
    </>
  );
}
