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
import TeacherSettingsModal from '@/components/TeacherSettingsModal';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeacherSettings } from '@/lib/useTeacherSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { toSlug } from '@/lib/slug';

type View = 'week' | 'month';

export default function TeacherDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const today = todayInIsrael();

  const [view, setView] = useState<View>('month');
  const [showSettings, setShowSettings] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const { settings, save: saveSettings } = useTeacherSettings();

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setTeacherId(data.user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.user.id)
        .single();
      if (profile?.display_name) setTeacherName(profile.display_name);
    });
  }, []);
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

  async function handleAddStudent(req: PendingRequest) {
    setActionLoading(req.id);
    await fetch('/api/teacher/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: req.student_name, email: req.student_email, phone: req.student_phone ?? null }),
    });
    // Also dismiss the access request
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
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{t('teacher.schedule')}</h1>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          <Link href="/teacher/students" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('common.students')}</Link>
          <Link href="/teacher/templates" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('teacher.slots')}</Link>
          <Link href="/teacher/billing" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('teacher.billing')}</Link>
          <Link href="/teacher/messages" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('teacher.messages')}</Link>
          <button
            onClick={() => { loadRequests(); if (view === 'week') loadWeek(weekStart); else loadMonth(month); }}
            className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            title={t('common.refresh')}
          >
            ↺
          </button>
          <button onClick={() => setShowShareLink(true)} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors" title={t('teacher.shareLink')}>{t('teacher.shareLink')}</button>
          <button onClick={() => setShowSettings(true)} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors" title={t('common.settings')}>⚙</button>
          <LanguageToggle />
          <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('common.signOut')}</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-5">

        {/* View toggle + navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
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
              {t('common.week')}
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 font-medium transition-colors ${view === 'month' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {t('common.month')}
            </button>
          </div>
        </div>

        {/* Pending requests panel */}
        {!requestsLoading && requests.length > 0 && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
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
                          <button
                            onClick={() => handleAddStudent(req)}
                            disabled={busy}
                            className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
                          >
                            {t('teacher.addStudent')}
                          </button>
                          <button
                            onClick={() => handleRequestAction(req, 'dismiss')}
                            disabled={busy}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            {t('common.dismiss')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRequestAction(req, isCancel ? 'approve-cancellation' : 'approve')}
                            disabled={busy}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {t('common.approve')}
                          </button>
                          <button
                            onClick={() => handleRequestAction(req, isCancel ? 'approve' : 'reject')}
                            disabled={busy}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
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

        {loading ? (
          <div className="mt-8 text-center text-gray-400">{t('common.loading')}</div>
        ) : (
          <TeacherCalendar
            slots={slots}
            weekStarts={weekStarts}
            today={today}
            onSelectSlot={setSelected}
            timeFormat={settings.time_format}
          />
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {([
            { color: 'bg-emerald-400', key: 'slot.open' },
            { color: 'bg-gray-400',    key: 'slot.blocked' },
            { color: 'bg-amber-400',   key: 'slot.pending' },
            { color: 'bg-blue-500',    key: 'slot.approved' },
            { color: 'bg-purple-500',  key: 'slot.completed' },
            { color: 'bg-emerald-500', key: 'slot.paid' },
            { color: 'bg-orange-400',  key: 'slot.cancelReq' },
          ] as const).map(({ color, key }) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {t(key)}
            </span>
          ))}
        </div>
      </main>

      {selected && (
        <SlotPanel slot={selected} onClose={() => setSelected(null)} onAction={handleAction} timeFormat={settings.time_format} />
      )}

      {showSettings && (
        <TeacherSettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showShareLink && teacherId && (
        <ShareLinkModal teacherId={teacherId} teacherName={teacherName} onClose={() => setShowShareLink(false)} />
      )}
    </div>
  );
}

function ShareLinkModal({ teacherId, teacherName, onClose }: { teacherId: string; teacherName: string; onClose: () => void }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lessons-scheduler.com';
  const slug = toSlug(teacherName);
  const link = slug ? `${origin}/${slug}` : `${origin}/join/${teacherId}`;
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  function copy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    const el = document.createElement('textarea');
    el.value = link;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{t('teacher.studentLoginLink')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-500">{t('teacher.shareLinkDesc')}</p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-700 truncate flex-1 select-all">{link}</span>
          <button
            onClick={copy}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap flex-shrink-0"
          >
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}
