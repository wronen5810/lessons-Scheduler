'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { StudentNote } from '@/app/api/teacher/students/[id]/notes/route';
import StudentNotebook from '@/components/StudentNotebook';
import { createBrowserSupabase } from '@/lib/supabase-browser';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  rate: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [notesStudent, setNotesStudent] = useState<Student | null>(null);
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notebookStudent, setNotebookStudent] = useState<Student | null>(null);
  const [teacherId, setTeacherId] = useState<string>('');
  const [loginHistoryStudent, setLoginHistoryStudent] = useState<Student | null>(null);
  const [loginHistory, setLoginHistory] = useState<{ id: string; student_name: string; student_email: string; logged_in_at: string }[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/teacher/students');
    setStudents(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    createBrowserSupabase().auth.getUser().then(({ data }) => {
      if (data.user) setTeacherId(data.user.id);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setAdding(true);
    const res = await fetch('/api/teacher/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error); } else { setName(''); setEmail(''); load(); }
    setAdding(false);
  }

  async function toggleActive(student: Student) {
    await fetch(`/api/teacher/students/${student.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !student.is_active }),
    });
    load();
  }

  async function handleDelete(student: Student) {
    if (!confirm(`Remove ${student.name}?`)) return;
    await fetch(`/api/teacher/students/${student.id}`, { method: 'DELETE' });
    load();
  }

  async function openLoginHistory(student: Student) {
    setLoginHistoryStudent(student);
    setLoginHistory([]);
    setLoginHistoryLoading(true);
    const res = await fetch(`/api/teacher/student-logins?email=${encodeURIComponent(student.email)}`);
    if (res.ok) setLoginHistory(await res.json());
    setLoginHistoryLoading(false);
  }

  async function openNotes(student: Student) {
    setNotesStudent(student);
    setStudentNotes([]);
    setNotesLoading(true);
    const res = await fetch(`/api/teacher/students/${student.id}/notes`);
    if (res.ok) setStudentNotes(await res.json());
    setNotesLoading(false);
  }

  async function saveEdit() {
    if (!editing) return;
    setEditSaving(true);
    await fetch(`/api/teacher/students/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editing.name,
        phone: editing.phone || null,
        rate: editing.rate ?? null,
        notes: editing.notes || null,
      }),
    });
    setEditSaving(false);
    setEditing(null);
    load();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Students</h1>
        <Link href="/teacher" className="text-sm text-blue-600 hover:underline">← Schedule</Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Add student */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Student</h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Full name" required value={name} onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={adding}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap">
              {adding ? 'Adding...' : 'Add'}
            </button>
          </form>
          {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
        </div>

        {/* Student list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
          ) : students.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No students yet.</div>
          ) : students.map((student) => (
            <div key={student.id}>
              <div className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                  <p className="text-xs text-gray-400 truncate">{student.email}</p>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {student.phone && <span className="text-xs text-gray-500">📞 {student.phone}</span>}
                    {student.rate != null && <span className="text-xs text-gray-500">₪{student.rate}/lesson</span>}
                    {student.notes && <span className="text-xs text-gray-400 italic truncate max-w-[200px]">{student.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setEditing({ ...student })}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => openLoginHistory(student)}
                    className="text-xs text-teal-600 hover:text-teal-800 px-2 py-1 rounded hover:bg-teal-50 transition-colors">
                    Logins
                  </button>
                  <button onClick={() => openNotes(student)}
                    className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50 transition-colors">
                    Notes
                  </button>
                  <button onClick={() => setNotebookStudent(student)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                    Notebook
                  </button>
                  <button onClick={() => toggleActive(student)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      student.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => handleDelete(student)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Edit Student</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input type="tel" value={editing.phone ?? ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                placeholder="e.g. 050-1234567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rate per lesson (₪)</label>
              <input type="number" min="0" step="0.01"
                value={editing.rate ?? ''} onChange={(e) => setEditing({ ...editing, rate: e.target.value ? Number(e.target.value) : null })}
                placeholder="e.g. 150"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea rows={3} value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                placeholder="Private notes about this student..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={saveEdit} disabled={editSaving}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {editSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(null)}
                className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Login history modal */}
      {loginHistoryStudent && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Login History — {loginHistoryStudent.name}</h3>
              <button onClick={() => setLoginHistoryStudent(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {loginHistoryLoading ? (
                <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
              ) : loginHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No login history yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">Date & Time</th>
                      <th className="text-left pb-2 font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loginHistory.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 text-gray-700 whitespace-nowrap pr-4">
                          {new Date(l.logged_in_at).toLocaleString()}
                        </td>
                        <td className="py-2 text-gray-500">{l.student_email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <button onClick={() => setLoginHistoryStudent(null)}
              className="w-full border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notes modal */}
      {notesStudent && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Notes — {notesStudent.name}</h3>
              <button onClick={() => setNotesStudent(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {notesLoading ? (
                <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
              ) : studentNotes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No notes for this student.</p>
              ) : (
                studentNotes.map((n) => (
                  <div key={n.note_id} className="border border-gray-200 rounded-xl p-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="font-medium text-gray-600">{n.date}</span>
                      {n.start_time && <span>{n.start_time}{n.end_time ? `–${n.end_time}` : ''}</span>}
                      <span className={`ml-auto px-1.5 py-0.5 rounded-full font-medium ${n.visible_to_student ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {n.visible_to_student ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{n.note}</p>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => setNotesStudent(null)}
              className="w-full border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notebook modal */}
      {notebookStudent && teacherId && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Notebook — {notebookStudent.name}</h3>
              <button onClick={() => setNotebookStudent(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <StudentNotebook teacherId={teacherId} email={notebookStudent.email} />
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={() => setNotebookStudent(null)}
                className="w-full border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
