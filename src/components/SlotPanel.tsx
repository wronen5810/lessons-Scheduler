'use client';

import { useState, useEffect } from 'react';
import { DAY_NAMES, formatDisplayDateLong, formatTimeDisplay } from '@/lib/dates';
import type { ComputedSlot } from '@/lib/types';
import DirectBookForm from './DirectBookForm';
import { parseISO } from 'date-fns';

interface Note {
  id: string;
  note: string;
  visible_to_student: boolean;
  created_at: string;
}

interface Props {
  slot: ComputedSlot;
  onClose: () => void;
  onAction: () => void;
  timeFormat?: '24h' | '12h';
}

export default function SlotPanel({ slot, onClose, onAction, timeFormat = '24h' }: Props) {
  const [loading, setLoading] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState('');
  const [noteVisible, setNoteVisible] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelEndDate, setCancelEndDate] = useState(slot.date);

  const dayOfWeek = parseISO(slot.date).getDay();
  const hasBooking = !!slot.booking_id && !!slot.booking_type;

  useEffect(() => {
    if (hasBooking) loadNotes();
  }, [slot.booking_id]);

  async function loadNotes() {
    const res = await fetch(`/api/teacher/notes?booking_type=${slot.booking_type}&booking_id=${slot.booking_id}`);
    if (res.ok) setNotes(await res.json());
  }

  async function addNote() {
    if (!noteText.trim() || !hasBooking) return;
    setAddingNote(true);
    await fetch('/api/teacher/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_type: slot.booking_type, booking_id: slot.booking_id, note: noteText, visible_to_student: noteVisible }),
    });
    setNoteText('');
    setNoteVisible(false);
    setAddingNote(false);
    loadNotes();
  }

  async function toggleNoteVisibility(note: Note) {
    await fetch(`/api/teacher/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible_to_student: !note.visible_to_student }),
    });
    loadNotes();
  }

  async function deleteNote(id: string) {
    await fetch(`/api/teacher/notes/${id}`, { method: 'DELETE' });
    loadNotes();
  }

  async function patchBooking(action: 'approve' | 'reject' | 'cancel' | 'complete' | 'pay' | 'approve-cancellation', endDate?: string) {
    if (!slot.booking_id || !slot.booking_type) return;
    setLoading(true);
    const url = `/api/bookings/${slot.booking_id}?type=${slot.booking_type}&action=${action}${endDate ? `&end_date=${endDate}` : ''}`;
    const res = await fetch(url, { method: 'PATCH' });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Action failed. Please try again.');
      return;
    }
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
        body: JSON.stringify({ template_id: slot.template_id, specific_date: slot.date, is_blocked: block }),
      });
    }
    setLoading(false);
    onAction();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="font-bold text-gray-900 text-base">
              {formatTimeDisplay(slot.start_time, timeFormat)} – {formatTimeDisplay(slot.end_time, timeFormat)}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">{formatDisplayDateLong(slot.date)}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl transition-colors">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Student / group info */}
          {(['pending', 'confirmed', 'completed', 'paid', 'cancellation_requested'] as const).includes(slot.state as never) && slot.student_name && (
            <div className="bg-slate-50 rounded-xl p-4 text-sm">
              {slot.group_id ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-900 text-base">{slot.group_name ?? slot.student_name}</div>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Group</span>
                  </div>
                  {slot.group_member_count != null && (
                    <div className="text-gray-500 mt-0.5">{slot.group_member_count} student{slot.group_member_count !== 1 ? 's' : ''}</div>
                  )}
                </>
              ) : (
                <>
                  <div className="font-semibold text-gray-900 text-base">{slot.student_name}</div>
                  <div className="text-gray-500 mt-0.5">{slot.student_email}</div>
                </>
              )}
              <div className="mt-1.5 text-xs text-gray-400 capitalize">
                {slot.booking_type === 'recurring'
                  ? `Recurring · every ${DAY_NAMES[dayOfWeek]}`
                  : 'One-time lesson'}
              </div>
            </div>
          )}

          {/* Actions */}
          {slot.state === 'available' && !showBookForm && (
            <div className="space-y-2">
              <button onClick={() => setShowBookForm(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                Book for student
              </button>
              <button onClick={() => toggleOverride(true)} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
                Block this slot
              </button>
            </div>
          )}

          {slot.state === 'available' && showBookForm && (
            <DirectBookForm slot={slot} onCancel={() => setShowBookForm(false)} onDone={onAction} />
          )}

          {slot.state === 'blocked' && (
            <button onClick={() => toggleOverride(false)} disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              Unblock this slot
            </button>
          )}

          {slot.state === 'pending' && (
            <div className="space-y-2">
              <button onClick={() => patchBooking('approve')} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                Approve
              </button>
              <button onClick={() => patchBooking('reject')} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                Reject
              </button>
            </div>
          )}

          {slot.state === 'confirmed' && (
            <div className="space-y-2">
              <button onClick={() => patchBooking('complete')} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
                Mark as Completed
              </button>
              <button onClick={() => { setCancelEndDate(slot.date); setShowCancelModal(true); }} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors">
                {slot.booking_type === 'recurring' ? 'Set end date' : 'Cancel booking'}
              </button>
            </div>
          )}

          {slot.state === 'completed' && (
            <div className="space-y-2">
              <button onClick={() => patchBooking('pay')} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                Mark as Paid
              </button>
              <button onClick={() => patchBooking('approve')} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-blue-200 text-blue-600 text-sm hover:bg-blue-50 disabled:opacity-50 transition-colors">
                Revert to Approved
              </button>
              <button onClick={() => { setCancelEndDate(slot.date); setShowCancelModal(true); }} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors">
                {slot.booking_type === 'recurring' ? 'Set end date' : 'Cancel booking'}
              </button>
            </div>
          )}

          {slot.state === 'cancellation_requested' && (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
                <p className="font-medium">Student requested cancellation</p>
                {slot.cancellation_reason && <p className="text-xs mt-1">{slot.cancellation_reason}</p>}
              </div>
              <button onClick={() => patchBooking('approve-cancellation')} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                Approve cancellation
              </button>
              <button onClick={() => patchBooking('approve')} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
                Deny (keep booking)
              </button>
            </div>
          )}

          {slot.state === 'paid' && (
            <div className="space-y-2">
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center font-medium">
                Paid
              </div>
              <button onClick={() => patchBooking('complete')} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-purple-200 text-purple-600 text-sm hover:bg-purple-50 disabled:opacity-50 transition-colors">
                Revert to Completed
              </button>
              <button onClick={() => { setCancelEndDate(slot.date); setShowCancelModal(true); }} disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors">
                {slot.booking_type === 'recurring' ? 'Set end date' : 'Cancel booking'}
              </button>
            </div>
          )}

          {/* Notes section */}
          {hasBooking && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lesson Notes</h3>

              {/* Existing notes */}
              {notes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {notes.map((n) => (
                    <div key={n.id} className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm">
                      <p className="text-gray-800 leading-snug">{n.note}</p>
                      <div className="flex items-center justify-between mt-2">
                        <button onClick={() => toggleNoteVisibility(n)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                            n.visible_to_student
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}>
                          {n.visible_to_student ? 'Visible to student' : 'Hidden'}
                        </button>
                        <button onClick={() => deleteNote(n.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add note */}
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                    <input type="checkbox" checked={noteVisible} onChange={(e) => setNoteVisible(e.target.checked)}
                      className="rounded" />
                    Visible to student
                  </label>
                  <button onClick={addNote} disabled={addingNote || !noteText.trim()}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
                    {addingNote ? 'Adding...' : 'Add note'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">
              {slot.booking_type === 'recurring' ? 'Set end date' : 'Cancel booking'}
            </h3>

            {slot.booking_type === 'recurring' ? (
              <>
                <p className="text-sm text-gray-500">
                  All lessons from this date onward will be cancelled.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last lesson date</label>
                  <input
                    type="date"
                    value={cancelEndDate}
                    min={slot.date}
                    onChange={(e) => setCancelEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Are you sure you want to cancel this lesson?</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowCancelModal(false); patchBooking('cancel', slot.booking_type === 'recurring' ? cancelEndDate : undefined); }}
                disabled={loading}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {loading ? 'Saving...' : slot.booking_type === 'recurring' ? 'Confirm' : 'Cancel lesson'}
              </button>
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
