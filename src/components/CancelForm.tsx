'use client';

import { useEffect, useState } from 'react';
import { DAY_NAMES, formatDisplayDateLong } from '@/lib/dates';
import Link from 'next/link';

interface BookingInfo {
  booking_type: 'recurring' | 'one_time';
  student_name: string;
  date: string;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  cancellation_window_closed: boolean;
}

export default function CancelForm({ token }: { token: string }) {
  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/cancel/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          setErrorMsg(data.error || 'This cancellation link is invalid or has expired.');
          setStatus('error');
          return;
        }
        const data = await res.json();
        setInfo(data);
        setStatus('ready');
      })
      .catch(() => {
        setErrorMsg('Failed to load booking info.');
        setStatus('error');
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch(`/api/cancel/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error || 'Cancellation failed.');
      setStatus('error');
      return;
    }

    setStatus('done');
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 max-w-sm w-full text-center">
          <p className="text-red-600 text-sm">{errorMsg}</p>
          <Link href="/" className="mt-4 block text-sm text-blue-600 hover:underline">
            Back to schedule
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">&#10003;</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Lesson cancelled</h2>
          <p className="text-sm text-gray-500 mb-6">Your cancellation has been recorded.</p>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Book a new time
          </Link>
        </div>
      </div>
    );
  }

  if (!info) return null;

  if (info.cancellation_window_closed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-8 max-w-sm w-full text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cancellation window closed</h2>
          <p className="text-sm text-gray-500">
            Lessons can only be cancelled up to 24 hours before the scheduled time.
            Please contact the teacher directly.
          </p>
        </div>
      </div>
    );
  }

  const scheduleText =
    info.booking_type === 'recurring'
      ? `Every ${DAY_NAMES[info.day_of_week!]} at ${info.start_time}–${info.end_time}`
      : `${formatDisplayDateLong(info.date)} at ${info.start_time}–${info.end_time}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Cancel Lesson</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm">
          <div className="font-medium text-amber-800">{scheduleText}</div>
          <div className="text-amber-600 mt-0.5">Hi, {info.student_name}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for cancellation
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional — let the teacher know why you're cancelling"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Cancelling...' : 'Confirm cancellation'}
          </button>
        </form>
      </main>
    </div>
  );
}
