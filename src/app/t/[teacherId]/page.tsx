'use client';

import { use, useEffect, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  DAY_NAMES, DAY_NAMES_SHORT,
  formatDate, formatMonthDisplay, formatTimeDisplay,
  getEndTime, getMonthStr, getMonthWeekStarts,
  nextMonth, prevMonth, todayInIsrael,
} from '@/lib/dates';
import { DAY_NAMES_HE, DAY_NAMES_SHORT_HE } from '@/lib/i18n';
import type { ComputedSlot } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import StudentNotebook from '@/components/StudentNotebook';
import SaderotLogo from '@/components/SaderotLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

type Section = 'schedule' | 'notebook';
type Step = 'calendar' | 'times' | 'book' | 'done';

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

function getCalendarDays(monthStr: string): (string | null)[] {
  const [year, month] = monthStr.split('-').map(Number);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function StudentCalendar({ teacherId }: { teacherId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') ?? '';
  const { t, lang, isRTL } = useLanguage();
  const dayNamesShort = lang === 'he' ? DAY_NAMES_SHORT_HE : DAY_NAMES_SHORT;
  const dayNamesFull = lang === 'he' ? DAY_NAMES_HE : DAY_NAMES;

  const today = todayInIsrael();
  const [section, setSection] = useState<Section>('schedule');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(() => getMonthStr(today));
  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [allowCancellation, setAllowCancellation] = useState(true);

  // Multi-step flow
  const [step, setStep] = useState<Step>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ComputedSlot | null>(null);
  const [bookingType, setBookingType] = useState<'one_time' | 'recurring'>('one_time');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Cancel flow
  const [cancelTarget, setCancelTarget] = useState<StudentBooking | ComputedSlot | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

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

  useEffect(() => { loadMonth(month); }, [month]);
  useEffect(() => { loadBookings(); }, [email, teacherId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function handleSignOut() {
    router.push(`/t/${teacherId}`);
  }

  useEffect(() => {
    fetch(`/api/teacher-features/${teacherId}`)
      .then(r => r.json())
      .then(d => { if (d.allow_cancellation === false) setAllowCancellation(false); })
      .catch(() => {});
  }, [teacherId]);

  // Compute next lesson countdown from bookings
  const nextLesson = (() => {
    const now = new Date();
    let earliest: Date | null = null;
    for (const b of bookings) {
      if (b.status === 'cancellation_requested') continue;
      let lessonDate: Date | null = null;
      if (b.booking_type === 'one_time' && b.specific_date) {
        lessonDate = new Date(`${b.specific_date}T${b.start_time}`);
      } else if (b.booking_type === 'recurring' && b.day_of_week !== undefined) {
        const currentDow = now.getDay();
        let daysUntil = b.day_of_week - currentDow;
        if (daysUntil < 0) daysUntil += 7;
        const next = new Date(now);
        next.setDate(now.getDate() + daysUntil);
        const [h, m] = b.start_time.split(':').map(Number);
        next.setHours(h, m, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 7);
        lessonDate = next;
      }
      if (lessonDate && lessonDate > now && (!earliest || lessonDate < earliest)) {
        earliest = lessonDate;
      }
    }
    if (!earliest) return null;
    const diffMs = earliest.getTime() - now.getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  })();

  // Build date markers
  const dateMarkers = new Map<string, { available: boolean; booked: boolean }>();
  for (const slot of slots) {
    if (slot.state === 'unavailable' || slot.state === 'blocked') continue;
    if (!dateMarkers.has(slot.date)) dateMarkers.set(slot.date, { available: false, booked: false });
    const m = dateMarkers.get(slot.date)!;
    if (slot.state === 'available') m.available = true;
    else m.booked = true;
  }

  const calendarDays = getCalendarDays(month);

  // Slots for selected date
  const dateSlots = selectedDate ? slots.filter(s => s.date === selectedDate && s.state !== 'unavailable' && s.state !== 'blocked') : [];
  const availableSlots = dateSlots.filter(s => s.state === 'available');
  const bookedSlots = dateSlots.filter(s => s.state !== 'available');

  function handleDateClick(date: string) {
    setSelectedDate(date);
    setStep('times');
    setSelectedSlot(null);
    setBookingError('');
  }

  function handleSlotClick(slot: ComputedSlot) {
    setSelectedSlot(slot);
    setBookingType(slot.one_time_slot_id ? 'one_time' : 'one_time');
    setBookingError('');
    setStep('book');
  }

  async function handleBook() {
    if (!selectedSlot || !email) return;
    setBookingLoading(true);
    setBookingError('');
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_type: bookingType,
        ...(selectedSlot.one_time_slot_id
          ? { one_time_slot_id: selectedSlot.one_time_slot_id }
          : { template_id: selectedSlot.template_id }),
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        student_email: email,
        teacher_id: teacherId,
      }),
    });
    setBookingLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setBookingError(d.error || 'Something went wrong. Please try again.');
      return;
    }
    setStep('done');
    loadBookings();
    loadMonth(month);
  }

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

  const selectedDateObj = selectedDate ? parseISO(selectedDate) : null;
  const selectedDateLabel = selectedDateObj
    ? `${format(selectedDateObj, 'dd/MM/yyyy')} (${dayNamesFull[selectedDateObj.getDay()]})`
    : '';

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SaderotLogo size="sm" />
            {email && <p className="text-xs text-gray-400">{email}</p>}
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            {/* Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                {t('common.menu')}
                <svg className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute end-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  <button
                    onClick={() => { setSection('schedule'); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${section === 'schedule' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
                  >
                    📅 {t('schedule.schedule')}
                  </button>
                  {email && (
                    <button
                      onClick={() => { setSection('notebook'); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${section === 'notebook' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
                    >
                      📓 {t('common.notebook')}
                    </button>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    🚪 {t('common.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* Notebook */}
        {section === 'notebook' && email && <StudentNotebook teacherId={teacherId} email={email} />}

        {/* Schedule */}
        {section === 'schedule' && (
          <div className="space-y-5">

            {/* Next lesson countdown */}
            {step === 'calendar' && email && nextLesson && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/>
                </svg>
                <p className="text-sm font-medium text-blue-800">
                  {nextLesson.hours > 0
                    ? `${t('teacher.nextLesson').split('{')[0].trim()} ${nextLesson.hours}h ${nextLesson.minutes}m`
                    : `${t('teacher.nextLesson').split('{')[0].trim()} ${nextLesson.minutes}m`}
                </p>
              </div>
            )}

            {/* ── STEP: CALENDAR ── */}
            {step === 'calendar' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Month nav */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <button onClick={() => setMonth(prevMonth(month))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-lg">‹</button>
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">{formatMonthDisplay(month)}</span>
                  <button onClick={() => setMonth(nextMonth(month))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-lg">›</button>
                </div>

                <div className="px-4 pb-4">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {dayNamesShort.map((d) => (
                      <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  {loading ? (
                    <div className="py-10 text-center text-sm text-gray-400">{t('common.loading')}</div>
                  ) : (
                    <div className="grid grid-cols-7">
                      {calendarDays.map((date, i) => {
                        if (!date) return <div key={`e${i}`} className="h-10" />;
                        const marker = dateMarkers.get(date);
                        const isPast = date < today;
                        const isToday = date === today;
                        const hasAvailable = !isPast && marker?.available;
                        const hasBooked = marker?.booked;
                        const isClickable = !isPast && (hasAvailable || hasBooked);
                        const dayNum = parseInt(date.slice(8));

                        return (
                          <div key={date} className="h-10 flex items-center justify-center">
                            <button
                              onClick={() => isClickable && handleDateClick(date)}
                              disabled={!isClickable}
                              className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all
                                ${!isClickable && !isToday ? 'text-gray-300 cursor-default' : ''}
                                ${isToday && !hasAvailable && !hasBooked ? 'ring-2 ring-blue-400 text-blue-600 font-bold' : ''}
                                ${hasAvailable && !hasBooked ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer font-semibold' : ''}
                                ${hasBooked && !hasAvailable ? 'bg-blue-100 text-blue-900 hover:bg-blue-200 cursor-pointer font-semibold' : ''}
                                ${hasAvailable && hasBooked ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer font-semibold ring-2 ring-blue-400 ring-offset-1' : ''}
                                ${isToday && (hasAvailable || hasBooked) ? 'ring-offset-1' : ''}
                              `}
                            >
                              {dayNum}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="px-6 py-3 border-t border-gray-50 flex flex-wrap gap-4">
                  <span className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 inline-block" />
                    {t('slot.available')}
                  </span>
                  {email && (
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 inline-block" />
                      {t('slot.confirmed')}
                    </span>
                  )}
                  {email && (
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-5 h-5 rounded-full bg-amber-100 ring-2 ring-blue-400 ring-offset-1 inline-block" />
                      Both
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP: TIMES ── */}
            {step === 'times' && selectedDate && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <button onClick={() => setStep('calendar')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
                    ‹ {t('common.back')}
                  </button>
                  <h2 className="text-base font-bold text-gray-900">{selectedDateLabel}</h2>
                </div>

                <div className="px-5 py-4 space-y-5">
                  {/* Available times */}
                  {availableSlots.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-3">{t('schedule.schedule')}</p>
                      <div className="flex flex-wrap gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={`${slot.date}-${slot.start_time}`}
                            onClick={() => handleSlotClick(slot)}
                            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 transition-all"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
                            </svg>
                            {formatTimeDisplay(slot.start_time, '24h')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student's booked lessons this day */}
                  {bookedSlots.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-3">{t('schedule.myBookings')}</p>
                      <div className="space-y-2">
                        {bookedSlots.map((slot) => {
                          const statusColors: Record<string, string> = {
                            pending: 'bg-amber-50 border-amber-200 text-amber-800',
                            confirmed: 'bg-blue-50 border-blue-200 text-blue-800',
                            completed: 'bg-violet-50 border-violet-200 text-violet-800',
                            paid: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                            cancellation_requested: 'bg-rose-50 border-rose-200 text-rose-800',
                          };
                          const cls = statusColors[slot.state] ?? 'bg-gray-50 border-gray-200 text-gray-700';
                          const statusLabel: Record<string, string> = {
                            pending: t('slot.pending'), confirmed: t('slot.approved'),
                            completed: t('slot.completed'), paid: t('slot.paid'),
                            cancellation_requested: t('slot.cancelReq'),
                          };
                          return (
                            <div key={`${slot.date}-${slot.start_time}`} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${cls}`}>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
                                </svg>
                                <span className="text-sm font-semibold">{formatTimeDisplay(slot.start_time, '24h')}</span>
                                {slot.booking_type && (
                                  <span className="text-xs opacity-70">{slot.booking_type === 'one_time' ? '1×' : '↺'}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium opacity-80">{statusLabel[slot.state]}</span>
                                {allowCancellation && slot.state === 'confirmed' && slot.booking_id && (
                                  <button
                                    onClick={() => { setCancelTarget(slot); setCancelReason(''); setCancelError(''); }}
                                    className="text-xs underline opacity-60 hover:opacity-100"
                                  >
                                    {t('schedule.requestCancel')}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {availableSlots.length === 0 && bookedSlots.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">{t('teacher.noLessonsDay')}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP: BOOK ── */}
            {step === 'book' && selectedSlot && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <button onClick={() => setStep('times')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
                    ‹ {t('common.back')}
                  </button>
                  <h2 className="text-base font-bold text-gray-900">{selectedDateLabel}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatTimeDisplay(selectedSlot.start_time, '24h')} – {formatTimeDisplay(selectedSlot.end_time, '24h')}
                  </p>
                </div>

                <div className="px-5 py-5 space-y-4">
                  {!email ? (
                    <p className="text-sm text-gray-500 text-center py-4">Please sign in to book a lesson.</p>
                  ) : (
                    <>
                      {/* Booking type (only for template slots) */}
                      {!selectedSlot.one_time_slot_id && selectedSlot.template_id && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700 mb-3">How would you like to book?</p>
                          <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${bookingType === 'one_time' ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="radio" name="bookingType" value="one_time" checked={bookingType === 'one_time'} onChange={() => setBookingType('one_time')} className="mt-0.5 accent-amber-500" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{t('schedule.oneTime')}</p>
                              <p className="text-xs text-gray-500 mt-0.5">Book just this single session</p>
                            </div>
                          </label>
                          <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${bookingType === 'recurring' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="radio" name="bookingType" value="recurring" checked={bookingType === 'recurring'} onChange={() => setBookingType('recurring')} className="mt-0.5 accent-blue-500" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{t('teacher.recurring')}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Book every {dayNamesFull[selectedDateObj?.getDay() ?? 0]} at {formatTimeDisplay(selectedSlot.start_time, '24h')}
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      {selectedSlot.one_time_slot_id && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-sm font-semibold text-amber-900">{t('schedule.oneTime')}</p>
                          <p className="text-xs text-amber-700 mt-0.5">This is a single available session</p>
                        </div>
                      )}

                      {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}

                      <button
                        onClick={handleBook}
                        disabled={bookingLoading}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {bookingLoading ? t('common.sending') : t('schedule.submitRequest')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP: DONE ── */}
            {step === 'done' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
                <h2 className="text-lg font-bold text-gray-900">Request sent!</h2>
                <p className="text-sm text-gray-500">Your teacher will review and confirm your booking.</p>
                <button onClick={() => setStep('calendar')} className="text-sm text-blue-600 hover:underline">
                  ← Back to calendar
                </button>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Cancel modal */}
      {cancelTarget && (() => {
        const state = 'state' in cancelTarget ? cancelTarget.state : cancelTarget.status;
        const isPending = state === 'cancellation_requested';
        const isReadOnly = state === 'completed' || state === 'paid';
        const title = 'state' in cancelTarget
          ? `${(cancelTarget as ComputedSlot).date} · ${(cancelTarget as ComputedSlot).start_time}` : '';
        return (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
              {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
              {isReadOnly ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                  {t('schedule.lessonCompleted', { state: state === 'paid' ? t('slot.paid').toLowerCase() : t('slot.completed').toLowerCase() })}
                </div>
              ) : isPending ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                  {t('schedule.cancelPending')}
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">{t('schedule.cancelReason')}</p>
                  <textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={t('schedule.cancelPlaceholder')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {cancelError && <p className="text-sm text-red-600">{cancelError}</p>}
                  <button onClick={submitCancelRequest} disabled={cancelLoading || !cancelReason.trim()}
                    className="w-full bg-red-600 text-white text-sm font-medium rounded-lg py-2 hover:bg-red-700 disabled:opacity-50 transition-colors">
                    {cancelLoading ? t('schedule.submitting') : t('schedule.submitRequest')}
                  </button>
                </>
              )}
              <button onClick={() => setCancelTarget(null)}
                className="w-full border border-gray-300 text-gray-600 text-sm rounded-lg py-2 hover:bg-gray-50 transition-colors">
                {t('common.close')}
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
