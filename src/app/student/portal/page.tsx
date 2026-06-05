'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MessageSquare, BookOpen, Settings, LogOut, ChevronDown, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import SaderotLogo from '@/components/SaderotLogo';
import StudentNotebook from '@/components/StudentNotebook';
import StudentPushRegistrar from '@/components/StudentPushRegistrar';
import PolicyFooter from '@/components/PolicyFooter';
import EventCell from '@/components/EventCell';
import type { CalendarEvent, CalendarEventType } from '@/lib/types';
import { todayInIsrael } from '@/lib/dates';

const EVENT_TYPES: CalendarEventType[] = ['exam', 'task', 'paperwork', 'vacation', 'other'];

type Tab = 'schedule' | 'messages' | 'notebook' | 'settings';

interface TeacherSession {
  teacherId: string;
  token: string;
  email: string;
  teacherName?: string;
}

interface StudentBooking {
  id: string;
  booking_type: 'recurring' | 'one_time';
  status: string;
  start_time: string;
  end_time: string;
  day_of_week?: number;
  specific_date?: string;
  is_group?: boolean;
  group_name?: string;
}

interface Message {
  id: string;
  direction: 'to_student' | 'to_teacher';
  body: string;
  sent_at: string;
}

interface Settings {
  email: string;
  phone: string | null;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancellation_requested: 'bg-orange-100 text-orange-700',
  };
  const labels: Record<string, string> = {
    approved: 'Approved',
    pending: 'Pending',
    cancellation_requested: 'Cancellation requested',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function StudentPortalPage() {
  const router = useRouter();
  const { t, lang, isRTL } = useLanguage();

  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [activeTeacher, setActiveTeacher] = useState<TeacherSession | null>(null);
  const [tab, setTab] = useState<Tab>('schedule');
  const [loaded, setLoaded] = useState(false);

  // Per-teacher data
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [allowCancellation, setAllowCancellation] = useState(true);

  // Events
  const [studentEvents, setStudentEvents] = useState<CalendarEvent[]>([]);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [evType, setEvType] = useState<CalendarEventType>('exam');
  const [evDate, setEvDate] = useState('');
  const [evTime, setEvTime] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evSaving, setEvSaving] = useState(false);

  // Compose message
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Settings edit
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // On mount: collect all stored student tokens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const found: TeacherSession[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('st_')) continue;
      const teacherId = key.slice(3);
      const token = localStorage.getItem(key);
      if (!token) continue;
      // Parse email from token (payload is first segment, base64url encoded)
      try {
        const payload = JSON.parse(atob(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp < Date.now() / 1000) continue; // expired
        found.push({ teacherId, token, email: payload.email });
      } catch {
        continue;
      }
    }
    if (found.length === 0) {
      router.replace('/student');
      return;
    }
    setSessions(found);
    setActiveTeacher(found[0]);
    setLoaded(true);
  }, []);

  // Load teacher names
  useEffect(() => {
    sessions.forEach(async (s) => {
      try {
        const res = await fetch(`/api/teacher-profile/${s.teacherId}`);
        if (res.ok) {
          const d = await res.json();
          setSessions((prev) =>
            prev.map((p) => p.teacherId === s.teacherId ? { ...p, teacherName: d.display_name ?? s.teacherId } : p)
          );
        }
      } catch {}
    });
  }, [sessions.length]);

  // Load data when active teacher changes
  useEffect(() => {
    if (!activeTeacher) return;
    loadBookings(activeTeacher);
    loadMessages(activeTeacher);
    loadSettings(activeTeacher);
    loadEvents(activeTeacher);
    fetch(`/api/teacher-features/${activeTeacher.teacherId}`)
      .then(r => r.json())
      .then(d => { if (d.allow_cancellation === false) setAllowCancellation(false); })
      .catch(() => {});
  }, [activeTeacher?.teacherId]);

  async function loadBookings(s: TeacherSession) {
    const res = await fetch(
      `/api/student/bookings?email=${encodeURIComponent(s.email)}&teacherId=${s.teacherId}`,
      { headers: { Authorization: `Bearer ${s.token}` } }
    );
    if (res.status === 401) { router.replace('/student'); return; }
    if (res.ok) setBookings(await res.json());
  }

  async function loadMessages(s: TeacherSession) {
    const res = await fetch(`/api/student/messages?teacherId=${s.teacherId}`, {
      headers: { Authorization: `Bearer ${s.token}` },
    });
    if (res.ok) setMessages(await res.json());
  }

  async function loadEvents(s: TeacherSession) {
    const res = await fetch(
      `/api/student/events?email=${encodeURIComponent(s.email)}&teacherId=${s.teacherId}`,
      { headers: { Authorization: `Bearer ${s.token}` } }
    );
    if (res.ok) setStudentEvents(await res.json());
  }

  async function loadSettings(s: TeacherSession) {
    const res = await fetch('/api/student/settings', {
      headers: { Authorization: `Bearer ${s.token}` },
    });
    if (res.ok) {
      const d = await res.json();
      setSettings(d);
      setEditEmail(d.email ?? '');
      setEditPhone(d.phone ?? '');
    }
  }

  async function sendMessage() {
    if (!activeTeacher || !messageBody.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/student/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeTeacher.token}` },
        body: JSON.stringify({ teacherId: activeTeacher.teacherId, body: messageBody.trim() }),
      });
      if (res.ok) {
        setMessageBody('');
        loadMessages(activeTeacher);
      }
    } finally {
      setSendingMessage(false);
    }
  }

  async function requestCancellation(booking: StudentBooking) {
    if (!activeTeacher) return;
    await fetch(`/api/student/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeTeacher.token}` },
      body: JSON.stringify({ status: 'cancellation_requested' }),
    });
    loadBookings(activeTeacher);
  }

  async function saveSettings() {
    if (!activeTeacher) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/student/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeTeacher.token}` },
        body: JSON.stringify({ email: editEmail.trim() || undefined, phone: editPhone.trim() || undefined }),
      });
      if (res.ok) {
        const d = await res.json();
        // If email changed, update token
        if (d.token) {
          localStorage.setItem(`st_${activeTeacher.teacherId}`, d.token);
          setSessions((prev) =>
            prev.map((p) => p.teacherId === activeTeacher.teacherId ? { ...p, token: d.token, email: editEmail.trim() } : p)
          );
          setActiveTeacher((prev) => prev ? { ...prev, token: d.token, email: editEmail.trim() } : prev);
        }
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
      }
    } finally {
      setSavingSettings(false);
    }
  }

  function signOut() {
    if (typeof window !== 'undefined') {
      sessions.forEach(s => localStorage.removeItem(`st_${s.teacherId}`));
      // On web, forget the saved login so the next visit starts fresh.
      // On the native app, keep it so the app can auto-restore the session.
      const isNative = typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform === 'function'
        && (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform();
      if (!isNative) {
        localStorage.removeItem('last_student_email');
        localStorage.removeItem('last_teacher_id');
      }
    }
    router.replace('/student');
  }

  const today = todayInIsrael();
  const upcomingBookings = bookings
    .filter(b => b.status !== 'cancellation_requested')
    .sort((a, b) => {
      const dateA = a.specific_date ?? today;
      const dateB = b.specific_date ?? today;
      return dateA.localeCompare(dateB);
    });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'schedule', label: t('student.schedule'), icon: <Calendar size={16} /> },
    { id: 'messages', label: t('student.messages'), icon: <MessageSquare size={16} /> },
    { id: 'notebook', label: t('student.notebook'), icon: <BookOpen size={16} /> },
    { id: 'settings', label: t('student.settings'), icon: <Settings size={16} /> },
  ];

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Push notifications for the active teacher session */}
      {activeTeacher && <StudentPushRegistrar studentToken={activeTeacher.token} />}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <SaderotLogo size="sm" />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button onClick={signOut} className="text-slate-400 hover:text-slate-600 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Teacher selector (if multiple teachers) */}
      {sessions.length > 1 && (
        <div className="bg-white border-b border-slate-100 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto">
            {sessions.map(s => (
              <button
                key={s.teacherId}
                onClick={() => setActiveTeacher(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTeacher?.teacherId === s.teacherId
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.teacherName ?? s.teacherId.slice(0, 8)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single teacher label */}
      {sessions.length === 1 && activeTeacher?.teacherName && (
        <div className="bg-white border-b border-slate-100 px-4 py-2 text-sm text-slate-500">
          {activeTeacher.teacherName}
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 px-2">
        <div className="flex">
          {tabs.map(tab_ => (
            <button
              key={tab_.id}
              onClick={() => setTab(tab_.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === tab_.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab_.icon}
              <span className="hidden sm:inline">{tab_.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-4 max-w-2xl w-full mx-auto">

        {/* ── SCHEDULE ─────────────────────────────────────────────── */}
        {tab === 'schedule' && (
          <div className="space-y-3">
            {activeTeacher && (
              <a
                href={`/t/${activeTeacher.teacherId}?email=${encodeURIComponent(activeTeacher.email)}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                {t('student.bookLesson')}
              </a>
            )}
            {upcomingBookings.length === 0 ? (
              <p className="text-slate-400 text-center py-12">{t('student.noUpcoming')}</p>
            ) : (
              upcomingBookings.map(b => {
                const dayLabel = b.booking_type === 'recurring' && b.day_of_week !== undefined
                  ? `${lang === 'he' ? 'כל' : 'Every'} ${lang === 'he' ? DAY_NAMES_HE[b.day_of_week] : DAY_NAMES[b.day_of_week]}`
                  : b.specific_date ?? '';
                return (
                  <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-slate-800">
                          {dayLabel} · {b.start_time}–{b.end_time}
                        </div>
                        {b.is_group && b.group_name && (
                          <div className="text-sm text-slate-500 mt-0.5">{b.group_name}</div>
                        )}
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    {allowCancellation && b.status === 'approved' && (
                      <button
                        onClick={() => requestCancellation(b)}
                        className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
                      >
                        {t('student.requestCancellation')}
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {/* Upcoming Events */}
            <div className="pt-2 border-t border-slate-100 mt-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {t('events.upcomingEvents')}
                </h3>
                <button
                  onClick={() => { setEvDate(today); setAddEventOpen(true); }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + {t('events.addEvent')}
                </button>
              </div>
              {studentEvents.length === 0
                ? <p className="text-xs text-slate-400">{t('events.noEvents')}</p>
                : studentEvents.map(e => <EventCell key={e.id} event={e} />)
              }
            </div>
          </div>
        )}

        {/* Add Event Modal */}
        {addEventOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
              <h2 className="text-base font-semibold text-slate-800">{t('events.addEvent')}</h2>

              {/* Event type */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('events.eventType')}</label>
                <select
                  value={evType}
                  onChange={e => setEvType(e.target.value as CalendarEventType)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  {EVENT_TYPES.map(et => (
                    <option key={et} value={et}>{t(`events.${et}` as Parameters<typeof t>[0])}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('events.description')}</label>
                <input
                  type="text"
                  value={evDesc}
                  onChange={e => setEvDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('events.eventDate')}</label>
                <input
                  type="date"
                  value={evDate}
                  onChange={e => setEvDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  dir="ltr"
                />
              </div>

              {/* Time (optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('events.eventTime')}</label>
                <input
                  type="time"
                  value={evTime}
                  onChange={e => setEvTime(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  dir="ltr"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setAddEventOpen(false); setEvDesc(''); setEvTime(''); }}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  disabled={evSaving || !evDesc.trim() || !evDate}
                  onClick={async () => {
                    if (!activeTeacher || !evDesc.trim() || !evDate) return;
                    setEvSaving(true);
                    try {
                      const res = await fetch('/api/student/events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeTeacher.token}` },
                        body: JSON.stringify({
                          teacherId: activeTeacher.teacherId,
                          event_type: evType,
                          description: evDesc.trim(),
                          event_date: evDate,
                          event_time: evTime || null,
                        }),
                      });
                      if (res.ok) {
                        setAddEventOpen(false);
                        setEvDesc('');
                        setEvTime('');
                        setEvType('exam');
                        loadEvents(activeTeacher);
                      }
                    } finally {
                      setEvSaving(false);
                    }
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  {evSaving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MESSAGES ─────────────────────────────────────────────── */}
        {tab === 'messages' && (
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-center py-8">{t('student.noMessages')}</p>
            ) : (
              <div className="space-y-3">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`rounded-xl p-3 text-sm ${
                      m.direction === 'to_student'
                        ? 'bg-white border border-slate-200 text-slate-800'
                        : 'bg-blue-600 text-white ms-8'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.body}</div>
                    <div className={`text-xs mt-1 ${m.direction === 'to_student' ? 'text-slate-400' : 'text-blue-200'}`}>
                      {new Date(m.sent_at).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Compose */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 mt-2">
              <textarea
                rows={3}
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                placeholder={t('student.messagePlaceholder')}
                className="w-full text-sm resize-none outline-none text-slate-800 placeholder:text-slate-400"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || !messageBody.trim()}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  {sendingMessage ? t('common.saving') : t('student.sendMessage')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTEBOOK ─────────────────────────────────────────────── */}
        {tab === 'notebook' && activeTeacher && (
          <StudentNotebook teacherId={activeTeacher.teacherId} email={activeTeacher.email} />
        )}

        {/* ── SETTINGS ─────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <h2 className="font-semibold text-slate-800">{t('student.settingsTitle')}</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('student.email')}</label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('student.phone')}</label>
              <input
                type="tel"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                dir="ltr"
              />
            </div>
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {savingSettings ? t('common.saving') : settingsSaved ? '✓ Saved' : t('common.save')}
            </button>
          </div>
        )}
      </main>

      <PolicyFooter />
    </div>
  );
}
