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

  const [bookingType, setBookingType] = useState<'recurring' | 'one_time'>(
    isOneTimeSlot ? 'one_time' : 'recurring'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_type: 'one_time',
        ...(isOneTimeSlot
          ? { one_time_slot_id: oneTimeSlotId }
          : { template_id: templateId, booking_type: bookingType }),
        date,
        start_time: time,
        student_name: name,
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">&#10003;</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Request sent!</h2>
          <p className="text-sm text-gray-500 mb-6">
            You&apos;ll receive an email once the teacher confirms your lesson.
          </p>
          <button
            onClick={() => router.push(teacherId ? `/t/${teacherId}` : '/')}
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
              <div className="font-medium text-blue-800">One-time slot &middot; {time} &ndash; {endTime}</div>
              <div className="text-blue-600 mt-0.5">{formatDisplayDateLong(date)}</div>
            </>
          ) : (
            <>
              <div className="font-medium text-blue-800">{DAY_NAMES[dayOfWeek]}s &middot; {time} &ndash; {endTime}</div>
              <div className="text-blue-600 mt-0.5">Starting {formatDisplayDateLong(date)}</div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          {!isOneTimeSlot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Booking type</label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="type" value="recurring" checked={bookingType === 'recurring'} onChange={() => setBookingType('recurring')} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Every week</div>
                    <div className="text-xs text-gray-500">Reserve every {DAY_NAMES[dayOfWeek]} at {time} on an ongoing basis</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="type" value="one_time" checked={bookingType === 'one_time'} onChange={() => setBookingType('one_time')} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">One time only</div>
                    <div className="text-xs text-gray-500">Just this date: {formatDisplayDateLong(date)}</div>
                  </div>
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
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending request...' : 'Send request'}
          </button>
        </form>
      </main>
    </div>
  );
}
