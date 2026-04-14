'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { StudentNote } from '@/app/api/teacher/students/[id]/notes/route';
import StudentNotebook from '@/components/StudentNotebook';
import GroupNotebook from '@/components/GroupNotebook';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import type { StudentGroup, GroupMember } from '@/lib/types';

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
  const [tab, setTab] = useState<'students' | 'groups'>('students');

  // ── Students state ───────────────────────────────────────────────
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

  // ── Groups state ─────────────────────────────────────────────────
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupRate, setGroupRate] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);
  const [groupFormError, setGroupFormError] = useState('');
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null);
  const [editGroupSaving, setEditGroupSaving] = useState(false);
  const [managingGroup, setManagingGroup] = useState<StudentGroup | null>(null);
  const [notebookGroup, setNotebookGroup] = useState<StudentGroup | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/teacher/students');
    setStudents(await res.json());
    setLoading(false);
  }

  async function loadGroups() {
    setGroupsLoading(true);
    const res = await fetch('/api/teacher/groups');
    if (res.ok) setGroups(await res.json());
    setGroupsLoading(false);
  }

  useEffect(() => {
    load();
    loadGroups();
    createBrowserSupabase().auth.getUser().then(({ data }) => {
      if (data.user) setTeacherId(data.user.id);
    });
  }, []);

  // ── Student handlers ─────────────────────────────────────────────
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

  // ── Group handlers ───────────────────────────────────────────────
  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    setGroupFormError('');
    setAddingGroup(true);
    const res = await fetch('/api/teacher/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, rate: groupRate ? Number(groupRate) : null }),
    });
    const data = await res.json();
    if (!res.ok) { setGroupFormError(data.error); } else { setGroupName(''); setGroupRate(''); loadGroups(); }
    setAddingGroup(false);
  }

  async function handleDeleteGroup(group: StudentGroup) {
    if (!confirm(`Delete group "${group.name}"? This will not affect existing bookings.`)) return;
    await fetch(`/api/teacher/groups/${group.id}`, { method: 'DELETE' });
    loadGroups();
  }

  async function saveEditGroup() {
    if (!editingGroup) return;
    setEditGroupSaving(true);
    await fetch(`/api/teacher/groups/${editingGroup.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingGroup.name, rate: editingGroup.rate }),
    });
    setEditGroupSaving(false);
    setEditingGroup(null);
    loadGroups();
  }

  async function addMemberToGroup(group: StudentGroup, studentId: string) {
    const res = await fetch(`/api/teacher/groups/${group.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to add student');
      return;
    }
    loadGroups();
  }

  async function removeMemberFromGroup(group: StudentGroup, member: GroupMember) {
    await fetch(`/api/teacher/groups/${group.id}/members/${member.student_id}`, { method: 'DELETE' });
    loadGroups();
  }

  // Members not yet in the group
  function availableStudents(group: StudentGroup) {
    const memberIds = new Set((group.members ?? []).map((m) => m.student_id));
    return students.filter((s) => s.is_active && !memberIds.has(s.id));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Students</h1>
        <Link href="/teacher" className="text-sm text-blue-600 hover:underline">← Schedule</Link>
      </header>

      {/* Tab switcher */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6">
        <div className="flex gap-0 max-w-3xl mx-auto">
          {(['students', 'groups'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ── STUDENTS TAB ───────────────────────────── */}
        {tab === 'students' && (
          <>
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
          </>
        )}

        {/* ── GROUPS TAB ─────────────────────────────── */}
        {tab === 'groups' && (
          <>
            {/* Create group form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Create Group</h2>
              <form onSubmit={handleAddGroup} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Group name"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Rate per lesson (₪)"
                  value={groupRate}
                  onChange={(e) => setGroupRate(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" disabled={addingGroup}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                  {addingGroup ? 'Creating...' : 'Create'}
                </button>
              </form>
              {groupFormError && <p className="text-sm text-red-600 mt-2">{groupFormError}</p>}
            </div>

            {/* Groups list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              {groupsLoading ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
              ) : groups.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">No groups yet.</div>
              ) : groups.map((group) => {
                const memberCount = group.members?.length ?? 0;
                const perStudent = group.rate != null && memberCount > 0
                  ? (group.rate / memberCount).toFixed(0)
                  : null;

                return (
                  <div key={group.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                        <div className="flex flex-wrap gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">{memberCount} student{memberCount !== 1 ? 's' : ''}</span>
                          {group.rate != null && (
                            <span className="text-xs text-gray-500">₪{group.rate}/lesson total</span>
                          )}
                          {perStudent != null && (
                            <span className="text-xs text-indigo-600 font-medium">₪{perStudent}/student</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setManagingGroup(managingGroup?.id === group.id ? null : { ...group })}
                          className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                          Members
                        </button>
                        <button onClick={() => setNotebookGroup({ ...group })}
                          className="text-xs text-violet-600 hover:text-violet-800 px-2 py-1 rounded hover:bg-violet-50 transition-colors">
                          Notebook
                        </button>
                        <button onClick={() => setEditingGroup({ ...group })}
                          className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteGroup(group)}
                          className="text-xs text-red-400 hover:text-red-600">
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Members panel */}
                    {managingGroup?.id === group.id && (
                      <div className="mt-4 border border-gray-100 rounded-xl p-4 bg-slate-50 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</p>

                        {(group.members ?? []).length === 0 ? (
                          <p className="text-xs text-gray-400">No members yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {(group.members ?? []).map((m) => (
                              <div key={m.id} className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="font-medium text-gray-800">{m.student_name}</span>
                                  <span className="text-gray-400 ml-2 text-xs">{m.student_email}</span>
                                </div>
                                <button
                                  onClick={() => removeMemberFromGroup(group, m)}
                                  className="text-xs text-red-400 hover:text-red-600 ml-3"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add student dropdown */}
                        {availableStudents(group).length > 0 && (
                          <div className="flex gap-2 pt-1">
                            <select
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  addMemberToGroup(group, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            >
                              <option value="">Add student…</option>
                              {availableStudents(group).map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {availableStudents(group).length === 0 && (group.members ?? []).length > 0 && (
                          <p className="text-xs text-gray-400">All active students are already in this group.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

      </main>

      {/* Edit student modal */}
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

      {/* Edit group modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Edit Group</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Group name</label>
              <input
                type="text"
                value={editingGroup.name}
                onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rate per lesson (₪) — total for group</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editingGroup.rate ?? ''}
                onChange={(e) => setEditingGroup({ ...editingGroup, rate: e.target.value ? Number(e.target.value) : null })}
                placeholder="e.g. 400"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {editingGroup.rate != null && (editingGroup.members?.length ?? 0) > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  ₪{(editingGroup.rate / (editingGroup.members?.length ?? 1)).toFixed(0)} per student
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={saveEditGroup} disabled={editGroupSaving}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {editGroupSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditingGroup(null)}
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

      {/* Group Notebook modal */}
      {notebookGroup && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Group Notebook — {notebookGroup.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Content shared with all group members</p>
              </div>
              <button onClick={() => setNotebookGroup(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <GroupNotebook groupId={notebookGroup.id} />
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={() => setNotebookGroup(null)}
                className="w-full border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
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
