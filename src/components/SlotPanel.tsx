'use client';

import { useState, useEffect } from 'react';
import { DAY_NAMES, formatDisplayDateLong, formatTimeDisplay } from '@/lib/dates';
import type { ComputedSlot, GroupMember } from '@/lib/types';
import DirectBookForm from './DirectBookForm';
import { parseISO } from 'date-fns';
import type { GroupPaymentRecord } from '@/app/api/teacher/group-payments/route';

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
  const [showEditSlot, setShowEditSlot] = useState(false);
  const [editSlotTime, setEditSlotTime] = useState(slot.start_time.slice(0, 5));
  const [editSlotDuration, setEditSlotDuration] = useState(slot.duration_minutes ?? 45);
  const [editSlotTitle, setEditSlotTitle] = useState(slot.title ?? '');
  const [editSlotMax, setEditSlotMax] = useState(slot.max_participants ?? 1);
  const [editSlotSaving, setEditSlotSaving] = useState(false);

  // Group payment state
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupPayments, setGroupPayments] = useState<GroupPaymentRecord[]>([]);
  const [payingStudentId, setPayingStudentId] = useState<string | null>(null);

  const dayOfWeek = parseISO(slot.date).getDay();
  const isMultiParticipant = (slot.max_participants ?? 1) > 1;
  const hasBooking = !!slot.booking_id && !!slot.booking_type && !isMultiParticipant;
  const isGroupBooking = !!slot.group_id && !isMultiParticipant;
  const showGroupPayments = isGroupBooking && ['completed', 'paid'].includes(slot.state);

  useEffect(() => {
    if (hasBooking) loadNotes();
    if (showGroupPayments) loadGroupPaymentData();
  }, [slot.booking_id]);

  async function loadGroupPaymentData() {
    const [membersRes, paymentsRes] = await Promise.all([
      fetch(`/api/teacher/groups/${slot.group_id}/members`),
      fetch(`/api/teacher/group-payments?booking_type=${slot.booking_type}&booking_id=${slot.booking_id}`),
    ]);
    if (membersRes.ok) setGroupMembers(await membersRes.json());
    if (paymentsRes.ok) setGroupPayments(await paymentsRes.json());
  }

  async function markStudentPaid(studentId: string) {
    setPayingStudentId(studentId);
    const res = await fetch('/api/teacher/group-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_type: slot.booking_type, booking_id: slot.booking_id, student_id: studentId }),
    });
    setPayingStudentId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to record payment');
      return;
    }
    const result = await res.json();
    await loadGroupPaymentData();
    if (result.all_paid) onAction(); // refresh calendar to show 'paid' state
  }

  async function undoStudentPayment(paymentId: string) {
    await fetch(`/api/teacher/group-payments/${paymentId}`, { method: 'DELETE' });
    await loadGroupPaymentData();
    onAction();
  }

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

  async function patchParticipant(bookingId: string, bookingType: 'recurring' | 'one_time', action: string) {
    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}?type=${bookingType}&action=${action}`, { method: 'PATCH' });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Action failed. Please try again.');
      return;
    }
    onAction();
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

  async function saveSlotEdit() {
    setEditSlotSaving(true);
    const body = JSON.stringify({ start_time: editSlotTime, duration_minutes: editSlotDuration, title: editSlotTitle.trim() || null, max_participants: editSlotMax });
    if (slot.one_time_slot_id) {
      await fetch(`/api/teacher/one-time-slots/${slot.one_time_slot_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
    } else if (slot.template_id) {
      await fetch(`/api/templates/${slot.template_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
    }
    setEditSlotSaving(false);
    setShowEditSlot(false);
    onAction();
    onClose();
  }

  async function deleteSlot() {
    const isRecurring = !slot.one_time_slot_id && !!slot.template_id;
    const msg = isRecurring
      ? 'Delete this recurring slot? All future occurrences will be removed from the schedule.'
      : 'Delete this slot?';
    if (!confirm(msg)) return;
    setLoading(true);
    if (slot.one_time_slot_id) {
      await fetch(`/api/teacher/one-time-slots/${slot.one_time_slot_id}`, { method: 'DELETE' });
    } else if (slot.template_id) {
      await fetch(`/api/templates/${slot.template_id}`, { method: 'DELETE' });
    }
    setLoading(false);
    onAction();
    onClose();
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
            {slot.title && <div className="text-sm font-semibold text-gray-800 mt-0.5">{slot.title}</div>}
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

          {/* Multi-participant: participant list */}
          {isMultiParticipant && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Participants</h3>
                <span className="text-xs text-gray-400">{slot.participant_count ?? 0} / {slot.max_participants}</span>
              </div>

              {(!slot.participants || slot.participants.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-3">No participants yet.</p>
              ) : (
                <div className="space-y-2">
                  {slot.participants.map((p) => {
                    const BADGE: Record<string, { bg: string; text: string; label: string }> = {
                      pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
                      approved: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approved' },
                      completed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Done' },
                      paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Paid' },
                      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
                      cancellation_requested: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Cancel req.' },
                      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled' },
                    };
                    const badge = BADGE[p.status] ?? BADGE.cancelled;
                    return (
                      <div key={p.booking_id} className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{p.student_name}</p>
                            <p className="text-xs text-gray-500 truncate">{p.student_email}</p>
                          </div>
                          <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {p.status === 'pending' && (
                            <>
                              <button onClick={() => patchParticipant(p.booking_id, p.booking_type, 'approve')} disabled={loading}
                                className="text-xs px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Approve</button>
                              <button onClick={() => patchParticipant(p.booking_id, p.booking_type, 'reject')} disabled={loading}
                                className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Reject</button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <button onClick={() => patchParticipant(p.booking_id, p.booking_type, 'complete')} disabled={loading}
                              className="text-xs px-2 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">Mark done</button>
                          )}
                          {p.status === 'completed' && (
                            <button onClick={() => patchParticipant(p.booking_id, p.booking_type, 'pay')} disabled={loading}
                              className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">Mark paid</button>
                          )}
                          {['pending', 'approved', 'completed'].includes(p.status) && (
                            <button onClick={() => patchParticipant(p.booking_id, p.booking_type, 'cancel')} disabled={loading}
                              className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50">Cancel</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add student if not full */}
              {(slot.participant_count ?? 0) < (slot.max_participants ?? 1) && !showBookForm && (
                <button onClick={() => setShowBookForm(true)}
                  className="mt-3 w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                  + Add student
                </button>
              )}
              {(slot.participant_count ?? 0) < (slot.max_participants ?? 1) && showBookForm && (
                <div className="mt-3">
                  <DirectBookForm slot={slot} onCancel={() => setShowBookForm(false)} onDone={onAction} />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!isMultiParticipant && slot.state === 'available' && !showBookForm && !showEditSlot && (
            <div className="space-y-2">
              <button onClick={() => setShowBookForm(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                Book for student
              </button>
              {slot.template_id && !slot.one_time_slot_id && (
                <button onClick={() => toggleOverride(true)} disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  Block this slot
                </button>
              )}
              {(slot.one_time_slot_id || slot.template_id) && (
                <>
                  <button onClick={() => setShowEditSlot(true)}
                    className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                    Edit slot
                  </button>
                  <button onClick={deleteSlot} disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors">
                    {slot.template_id && !slot.one_time_slot_id ? 'Delete recurring slot' : 'Delete slot'}
                  </button>
                </>
              )}
            </div>
          )}

          {!isMultiParticipant && slot.state === 'available' && showEditSlot && (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700">Edit slot</h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start time</label>
                <input type="time" value={editSlotTime} onChange={(e) => setEditSlotTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                <input type="number" min={15} max={180} step={5} value={editSlotDuration} onChange={(e) => setEditSlotDuration(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title (optional)</label>
                <input type="text" value={editSlotTitle} onChange={(e) => setEditSlotTitle(e.target.value)} placeholder="e.g. Piano lesson..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max students</label>
                <input type="number" min={1} max={100} value={editSlotMax} onChange={(e) => setEditSlotMax(Math.max(1, Number(e.target.value)))}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveSlotEdit} disabled={editSlotSaving}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {editSlotSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setShowEditSlot(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isMultiParticipant && slot.state === 'available' && showBookForm && (
            <DirectBookForm slot={slot} onCancel={() => setShowBookForm(false)} onDone={onAction} />
          )}

          {slot.state === 'blocked' && (
            <button onClick={() => toggleOverride(false)} disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              Unblock this slot
            </button>
          )}

          {!isMultiParticipant && slot.state === 'pending' && (
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

          {!isMultiParticipant && slot.state === 'confirmed' && (
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

          {!isMultiParticipant && slot.state === 'completed' && !isGroupBooking && (
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

          {!isMultiParticipant && slot.state === 'cancellation_requested' && (
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

          {!isMultiParticipant && slot.state === 'paid' && !isGroupBooking && (
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

          {/* Group payment panel — shown for completed or paid group lessons */}
          {showGroupPayments && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment per student</span>
                {groupMembers.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {groupPayments.length}/{groupMembers.length} paid
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {groupMembers.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400">No members in this group.</p>
                ) : groupMembers.map((member) => {
                  const payment = groupPayments.find((p) => p.student_id === member.student_id);
                  return (
                    <div key={member.student_id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{member.student_name}</p>
                        <p className="text-xs text-gray-400 truncate">{member.student_email}</p>
                      </div>
                      {payment ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Paid
                          </span>
                          <button
                            onClick={() => undoStudentPayment(payment.id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            title="Undo payment"
                          >
                            undo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => markStudentPaid(member.student_id)}
                          disabled={payingStudentId === member.student_id}
                          className="flex-shrink-0 text-xs font-medium px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {payingStudentId === member.student_id ? '...' : 'Mark paid'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                {slot.state === 'completed' && (
                  <button onClick={() => patchBooking('approve')} disabled={loading}
                    className="w-full py-2 px-4 rounded-xl border border-blue-200 text-blue-600 text-sm hover:bg-blue-50 disabled:opacity-50 transition-colors">
                    Revert to Approved
                  </button>
                )}
                {slot.state === 'paid' && (
                  <button onClick={() => patchBooking('complete')} disabled={loading}
                    className="w-full py-2 px-4 rounded-xl border border-purple-200 text-purple-600 text-sm hover:bg-purple-50 disabled:opacity-50 transition-colors">
                    Revert to Completed
                  </button>
                )}
                <button onClick={() => { setCancelEndDate(slot.date); setShowCancelModal(true); }} disabled={loading}
                  className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors">
                  {slot.booking_type === 'recurring' ? 'Set end date' : 'Cancel booking'}
                </button>
              </div>
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
