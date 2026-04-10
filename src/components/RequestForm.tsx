'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DAY_NAMES, formatDisplayDateLong, getEndTime } from '@/lib/dates';
import { parseISO } from 'date-fns';

export default function RequestForm() {
  const router = useRouter();
  const params = useSearchParams();
  const templateId = params.get('templateId') ?? '';
  const oneTimeSlotId = params.get('oneTimeSlotId') ?? '';
  const date = params.get('date') ?? '';
  const time = params.get('time') ?? '';
  const duration = Number(params.get('duration') ?? 45);
  const teacherId = params.get('teacherId') ?? '';
  const prefillEmail = params.get('email') ?? '';
  const isOneTimeSlot = !!oneTimeSlotId;

  const endTime = getEndTime(time, duration);
  const dayOfWeek = parseISO(date).getDay();

  // null = no selection yet (required for template slots; auto-set for one-time)
  const [bookingType, setBookingType] = useState<'recurring' | 'one_time' | null>(
    isOneTimeSlot ? 'one_time' : null
  );
  const email = prefillEmail;
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if ((!templateId && !oneTimeSlotId) || !date || !time) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Invalid booking link.</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <p className="text-gray-700 font-medium mb-2">You&apos;re not identified</p>
          <p className="text-sm text-gray-500 mb-5">Please sign in with your email first before booking a lesson.</p>
          <button
            onClick={() => router.push('/student')}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_type: bookingType!,
        ...(isOneTimeSlot
          ? { one_time_slot_id: oneTimeSlotId }
          : { template_id: templateId }),
        date,
        start_time: time,
        student_email: email,
        teacher_id: teacherId,
      }),
    });

    setLoading(false);

    if (res.status === 409) {
      setError('This slot was just taken. Please go back and choose another time.');
      return;
    }
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    setDone(true);
  }

  if (done) {
    const backUrl = teacherId
      ? `/t/${teacherId}${email ? `?email=${encodeURIComponent(email)}` : ''}`
      : '/';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">&#10003;</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Request sent!</h2>
          <p className="text-sm text-gray-500 mb-6">
            You&apos;ll receive an email once the teacher confirms your lesson.
          </p>
          <button
            onClick={() => router.push(backUrl)}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to schedule
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-1 block">
          &larr; Back
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Request a Lesson</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm">
          {isOneTimeSlot ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-800">{time} &ndash; {endTime}</span>
                <span className="text-xs font-medium bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">One-time</span>
              </div>
              <div className="text-blue-600 mt-0.5">{formatDisplayDateLong(date)}</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-800">{DAY_NAMES[dayOfWeek]}s &middot; {time} &ndash; {endTime}</span>
                <span className="text-xs font-medium bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Recurring slot</span>
              </div>
              <div className="text-blue-600 mt-0.5">Starting {formatDisplayDateLong(date)}</div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Booking type — only for recurring template slots */}
          {!isOneTimeSlot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col gap-1 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  bookingType === 'recurring'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="lessonType"
                    value="recurring"
                    checked={bookingType === 'recurring'}
                    onChange={() => setBookingType('recurring')}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900">Recurring</span>
                  <span className="text-xs text-gray-500">Every {DAY_NAMES[dayOfWeek]}</span>
                </label>
                <label className={`flex flex-col gap-1 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  bookingType === 'one_time'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="lessonType"
                    value="one_time"
                    checked={bookingType === 'one_time'}
                    onChange={() => setBookingType('one_time')}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900">One-time</span>
                  <span className="text-xs text-gray-500">Just this date</span>
                </label>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || bookingType === null}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending request...' : 'Send request'}
          </button>
        </form>
      </main>
    </div>
  );
}
