'use client';

import { useState } from 'react';
import { DAY_NAMES, formatDisplayDateLong } from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import DirectBookForm from './DirectBookForm';
import { parseISO } from 'date-fns';

interface Props {
  slot: ComputedSlot;
  onClose: () => void;
  onAction: () => void;
}

export default function SlotPanel({ slot, onClose, onAction }: Props) {
  const [loading, setLoading] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);

  const dayOfWeek = parseISO(slot.date).getDay();

  async function patchBooking(action: 'approve' | 'reject' | 'cancel' | 'complete' | 'pay' | 'approve-cancellation') {
    if (!slot.booking_id || !slot.booking_type) return;
    setLoading(true);
    await fetch(`/api/bookings/${slot.booking_id}?type=${slot.booking_type}&action=${action}`, {
      method: 'PATCH',
    });
    setLoading(false);
    onAction();
  }

  async function toggleOverride(block: boolean) {
    setLoading(true);
    if (!block && slot.override_id) {
      await fetch(`/api/overrides/${slot.override_id}`, { method: 'DELETE' });
    } else {
      await fetch('/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: slot.template_id,
          specific_date: slot.date,
          is_blocked: block,
        }),
      });
    }
    setLoading(false);
    onAction();
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div>
            <div className="font-semibold text-gray-900">
              {slot.start_time} &ndash; {slot.end_time}
            </div>
            <div className="text-sm text-gray-500">{formatDisplayDateLong(slot.date)}</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Student info for pending/confirmed/completed/paid/cancellation_requested */}
          {(['pending', 'confirmed', 'completed', 'paid', 'cancellation_requested'] as const).includes(slot.state as never) && slot.student_name && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-gray-900">{slot.student_name}</div>
              <div className="text-gray-500">{slot.student_email}</div>
              <div className="mt-1 text-xs text-gray-400 capitalize">
                {slot.booking_type === 'recurring'
                  ? `Recurring — every ${DAY_NAMES[dayOfWeek]}`
                  : 'One-time lesson'}
              </div>
            </div>
          )}

          {/* Available slot actions */}
          {slot.state === 'available' && !showBookForm && (
            <div className="space-y-2">
              <button
                onClick={() => setShowBookForm(true)}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Book for student
              </button>
              <button
                onClick={() => toggleOverride(true)}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Block this slot
              </button>
            </div>
          )}

          {/* Book form */}
          {slot.state === 'available' && showBookForm && (
            <DirectBookForm
              slot={slot}
              onCancel={() => setShowBookForm(false)}
              onDone={onAction}
            />
          )}

          {/* Blocked slot */}
          {slot.state === 'blocked' && (
            <button
              onClick={() => toggleOverride(false)}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Unblock this slot
            </button>
          )}

          {/* Pending slot */}
          {slot.state === 'pending' && (
            <div className="space-y-2">
              <button
                onClick={() => patchBooking('approve')}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => patchBooking('reject')}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </div>
          )}

          {/* Confirmed (approved) slot */}
          {slot.state === 'confirmed' && (
            <div className="space-y-2">
              <button
                onClick={() => patchBooking('complete')}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => patchBooking('cancel')}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Cancel booking
              </button>
            </div>
          )}

          {/* Completed slot */}
          {slot.state === 'completed' && (
            <button
              onClick={() => patchBooking('pay')}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Mark as Paid
            </button>
          )}

          {/* Cancellation requested */}
          {slot.state === 'cancellation_requested' && (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-orange-800">
                <p className="font-medium mb-1">Student requested cancellation</p>
                {slot.cancellation_reason && (
                  <p className="text-xs">Reason: {slot.cancellation_reason}</p>
                )}
              </div>
              <button
                onClick={() => patchBooking('approve-cancellation')}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Approve cancellation
              </button>
              <button
                onClick={() => patchBooking('approve')}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Deny (keep booking)
              </button>
            </div>
          )}

          {/* Paid slot */}
          {slot.state === 'paid' && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center font-medium">
              Paid
            </div>
          )}
        </div>
      </div>
    </>
  );
}
