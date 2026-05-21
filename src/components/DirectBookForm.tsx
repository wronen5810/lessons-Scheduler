'use client';

import { useEffect, useRef, useState } from 'react';
import { UserPlus } from 'lucide-react';
import type { ComputedSlot, StudentGroup } from '@/lib/types';

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  rate?: number | null;
}

interface Props {
  slot: ComputedSlot;
  onCancel: () => void;
  onDone: () => void;
}

export default function DirectBookForm({ slot, onCancel, onDone }: Props) {
  const isMultiParticipant = (slot.max_participants ?? 1) > 1;

  const [bookingType, setBookingType] = useState<'recurring' | 'one_time'>(
    slot.template_id ? 'recurring' : 'one_time'
  );
  const [bookFor, setBookFor] = useState<'student' | 'group'>('student');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [prepaid, setPrepaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inline new-student form
  const [showNewStudent, setShowNewStudent] = useState(false);
  const newStudentNameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showNewStudent) newStudentNameRef.current?.focus();
  }, [showNewStudent]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState('');

  async function createAndSelectStudent() {
    if (!newName.trim()) return;
    setAddingStudent(true);
    setAddStudentError('');
    const res = await fetch('/api/teacher/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() || null, phone: newPhone.trim() || null }),
    });
    setAddingStudent(false);
    if (!res.ok) {
      const d = await res.json();
      setAddStudentError(d.error || 'Failed to add student');
      return;
    }
    const created: Student = await res.json();
    setStudents((prev) => [...prev, created]);
    setSelectedStudentIds([created.id]);
    setShowNewStudent(false);
    setNewName(''); setNewEmail(''); setNewPhone('');
    setStudentSearch('');
  }

  useEffect(() => {
    fetch('/api/teacher/groups')
      .then((r) => r.ok ? r.json() : [])
      .then(setGroups);
    fetch('/api/teacher/students')
      .then((r) => r.ok ? r.json() : [])
      .then(setStudents);
  }, []);

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q)
    );
  });

  function toggleStudent(id: string) {
    if (isMultiParticipant) {
      setSelectedStudentIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedStudentIds([id]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const basePayload: Record<string, unknown> = {
      booking_type: bookingType,
      template_id: slot.template_id,
      one_time_slot_id: slot.one_time_slot_id,
      date: slot.date,
      start_time: slot.start_time,
      end_date: bookingType === 'recurring' && endDate ? endDate : undefined,
    };

    if (bookFor === 'group') {
      if (!selectedGroupId) { setError('Please select a group'); setLoading(false); return; }
      const res = await fetch('/api/teacher/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, group_id: selectedGroupId, prepaid: false }),
      });
      setLoading(false);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to book');
        return;
      }
    } else {
      if (selectedStudentIds.length === 0) { setError('Please select a student'); setLoading(false); return; }

      const selectedStudents = students.filter((s) => selectedStudentIds.includes(s.id));
      for (const student of selectedStudents) {
        const res = await fetch('/api/teacher/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            student_name: student.name,
            student_email: student.email,
            prepaid,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || `Failed to book for ${student.name}`);
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    }

    onDone();
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Book for: student or group toggle */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Book for</label>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setBookFor('student')}
            className={`flex-1 py-1.5 text-sm font-medium transition-colors ${bookFor === 'student' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {isMultiParticipant ? 'Students' : 'Individual'}
          </button>
          <button
            type="button"
            onClick={() => setBookFor('group')}
            className={`flex-1 py-1.5 text-sm font-medium transition-colors ${bookFor === 'group' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Group
          </button>
        </div>
      </div>

      {bookFor === 'student' ? (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-600">
              {isMultiParticipant
                ? `Select students${selectedStudentIds.length > 0 ? ` (${selectedStudentIds.length} selected)` : ''}`
                : 'Select student'}
            </label>
            {!showNewStudent && (
              <button
                type="button"
                onClick={() => setShowNewStudent(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <UserPlus className="w-3 h-3" />
                New student
              </button>
            )}
          </div>

          {showNewStudent ? (
            <div className="border border-blue-200 rounded-lg p-3 space-y-2 bg-blue-50">
              <p className="text-xs font-medium text-blue-800">Add new student</p>
              <input
                ref={newStudentNameRef}
                type="text"
                placeholder="Full name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {addStudentError && <p className="text-xs text-red-600">{addStudentError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={createAndSelectStudent}
                  disabled={addingStudent || !newName.trim()}
                  className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingStudent ? 'Adding…' : 'Add & select'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewStudent(false); setNewName(''); setNewEmail(''); setNewPhone(''); setAddStudentError(''); }}
                  className="flex-1 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
              />
              <div className="border border-gray-300 rounded-lg overflow-auto max-h-48">
                {students.length === 0 ? (
                  <p className="text-xs text-gray-400 p-3">No students yet.</p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 p-3">No match — use "New student" above.</p>
                ) : (
                  filteredStudents.map((s) => {
                    const isSelected = selectedStudentIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStudent(s.id)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 border-b border-gray-100 last:border-b-0 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <span className={`w-4 h-4 flex-shrink-0 flex items-center justify-center border ${isMultiParticipant ? 'rounded' : 'rounded-full'} ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="font-medium">{s.name}</span>
                          {s.email && (
                            <span className="text-gray-400 ml-1 text-xs truncate">· {s.email}</span>
                          )}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
          {groups.length === 0 ? (
            <p className="text-xs text-gray-400">No groups yet. Create one in the Students page.</p>
          ) : (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a group…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.members?.length ?? 0} students{g.rate != null ? ` · ₪${g.rate}/lesson` : ''})
                </option>
              ))}
            </select>
          )}
          {selectedGroup && selectedGroup.rate != null && (selectedGroup.members?.length ?? 0) > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Each student pays ₪{(selectedGroup.rate / (selectedGroup.members?.length ?? 1)).toFixed(0)}/lesson
            </p>
          )}
        </div>
      )}

      {slot.template_id && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select value={bookingType} onChange={(e) => setBookingType(e.target.value as 'recurring' | 'one_time')}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="recurring">Recurring (every week)</option>
            <option value="one_time">One time only</option>
          </select>
        </div>
      )}

      {bookingType === 'recurring' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Start date <span className="text-gray-400 font-normal">(first lesson)</span>
          </label>
          <input type="date" required value={slot.date} readOnly
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />
          <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">
            End date <span className="text-gray-400 font-normal">(last lesson)</span>
          </label>
          <input type="date" required={bookingType === 'recurring'} min={slot.date} value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      {bookFor === 'student' && (
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={prepaid}
            onChange={(e) => setPrepaid(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-blue-600"
          />
          <span>Prepaid <span className="text-gray-400 font-normal text-xs">(student already paid)</span></span>
        </label>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading}
          className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Booking...' : 'Book'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
