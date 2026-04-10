'use client';

import { useEffect, useState } from 'react';

interface Teacher {
  id: string;
  email: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit modal
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Impersonate
  const [impersonating, setImpersonating] = useState<string | null>(null);

  async function handleImpersonate(teacher: Teacher) {
    setImpersonating(teacher.id);
    const res = await fetch(`/api/admin/teachers/${teacher.id}/impersonate`, { method: 'POST' });
    const data = await res.json();
    setImpersonating(null);
    if (res.ok && data.url) {
      window.open(data.url, '_blank');
    } else {
      alert(data.error ?? 'Failed to generate login link');
    }
  }

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/teachers');
    if (!res.ok) { setError('Failed to load teachers'); setLoading(false); return; }
    setTeachers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setAdding(true);
    const res = await fetch('/api/admin/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, display_name: newName, password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error ?? 'Failed to create teacher');
    } else {
      setNewEmail(''); setNewName(''); setNewPassword('');
      setShowAdd(false);
      load();
    }
    setAdding(false);
  }

  async function handleEditSave() {
    if (!editing) return;
    setEditSaving(true);
    setEditError('');
    const res = await fetch(`/api/admin/teachers/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: editing.display_name,
        phone: editing.phone || null,
      }),
    });
    const data = await res.json();
    setEditSaving(false);
    if (!res.ok) {
      setEditError(data.error ?? 'Failed to save');
    } else {
      setEditing(null);
      load();
    }
  }

  async function toggleActive(teacher: Teacher) {
    await fetch(`/api/admin/teachers/${teacher.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !teacher.is_active }),
    });
    load();
  }

  async function handleDelete(teacher: Teacher) {
    if (!confirm(`Delete teacher ${teacher.display_name} (${teacher.email})? This will remove all their slots, bookings, and students.`)) return;
    await fetch(`/api/admin/teachers/${teacher.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Teachers</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add teacher
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New Teacher</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Display name</label>
                <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Initial password</label>
              <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={adding}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {adding ? 'Creating...' : 'Create teacher'}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setFormError(''); }}
                className="text-sm px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : teachers.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No teachers yet.</div>
        ) : teachers.map((teacher) => (
          <div key={teacher.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{teacher.display_name}</p>
              <p className="text-xs text-gray-500">{teacher.email}</p>
              {teacher.phone && <p className="text-xs text-gray-400">📱 {teacher.phone}</p>}
              <p className="text-xs text-gray-400 mt-0.5">Booking link: /t/{teacher.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleImpersonate(teacher)}
                disabled={impersonating === teacher.id}
                className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50 disabled:opacity-50 transition-colors"
              >
                {impersonating === teacher.id ? 'Opening...' : 'Login as'}
              </button>
              <button
                onClick={() => { setEditing({ ...teacher }); setEditError(''); }}
                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => toggleActive(teacher)}
                className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  teacher.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {teacher.is_active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => handleDelete(teacher)} className="text-xs text-red-500 hover:text-red-700">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Edit Teacher</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
              <input
                type="text"
                value={editing.display_name}
                onChange={(e) => setEditing({ ...editing, display_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mobile phone <span className="text-gray-400 font-normal">(for WhatsApp)</span></label>
              <input
                type="tel"
                value={editing.phone ?? ''}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                placeholder="e.g. +972501234567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Include country code. Used to send WhatsApp notifications to the teacher.</p>
            </div>

            {editError && <p className="text-sm text-red-600">{editError}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={handleEditSave} disabled={editSaving}
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
    </div>
  );
}
