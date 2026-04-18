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

interface Subscription {
  id: string;
  teacher_id: string;
  start_date: string;
  end_date: string | null;
  cost: number;
  notes: string | null;
  free_period_days: number;
  monthly_charge: number | null;
  status: 'active' | 'inactive';
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

  // Subscriptions
  const [subsTeacher, setSubsTeacher] = useState<Teacher | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [newSub, setNewSub] = useState({ start_date: '', end_date: '', cost: '0', notes: '', free_period_days: '0', monthly_charge: '' });
  const [addingSub, setAddingSub] = useState(false);
  const [subError, setSubError] = useState('');
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editSubSaving, setEditSubSaving] = useState(false);
  const [editSubError, setEditSubError] = useState('');
  const [defaultMonthlyCharge, setDefaultMonthlyCharge] = useState('20');
  const [savingDefault, setSavingDefault] = useState(false);

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

  async function openSubscriptions(teacher: Teacher) {
    setSubsTeacher(teacher);
    setSubsLoading(true);
    setSubs([]);
    setSubError('');
    setNewSub({ start_date: '', end_date: '', cost: '0', notes: '', free_period_days: '0', monthly_charge: '' });
    const [subRes, settingRes] = await Promise.all([
      fetch(`/api/admin/teacher-subscriptions?teacher_id=${teacher.id}`),
      fetch('/api/admin/settings?key=default_monthly_charge'),
    ]);
    setSubs(subRes.ok ? await subRes.json() : []);
    if (settingRes.ok) {
      const setting = await settingRes.json();
      setDefaultMonthlyCharge(setting.value ?? '20');
    }
    setSubsLoading(false);
  }

  async function handleSaveDefaultCharge() {
    setSavingDefault(true);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'default_monthly_charge', value: defaultMonthlyCharge }),
    });
    setSavingDefault(false);
  }

  async function handleAddSub() {
    if (!subsTeacher || !newSub.start_date) return;
    setAddingSub(true);
    setSubError('');
    const res = await fetch('/api/admin/teacher-subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_id: subsTeacher.id,
        start_date: newSub.start_date,
        end_date: newSub.end_date || null,
        cost: Number(newSub.cost) || 0,
        notes: newSub.notes || null,
        free_period_days: Number(newSub.free_period_days) || 0,
        monthly_charge: newSub.monthly_charge !== '' ? Number(newSub.monthly_charge) : null,
      }),
    });
    const data = await res.json();
    setAddingSub(false);
    if (!res.ok) {
      setSubError(data.error ?? 'Failed to add subscription');
    } else {
      setSubs((prev) => [data, ...prev]);
      setNewSub({ start_date: '', end_date: '', cost: '0', notes: '', free_period_days: '0', monthly_charge: '' });
    }
  }

  async function handleDeleteSub(sub: Subscription) {
    if (!confirm('Delete this subscription?')) return;
    await fetch(`/api/admin/teacher-subscriptions/${sub.id}`, { method: 'DELETE' });
    setSubs((prev) => prev.filter((s) => s.id !== sub.id));
  }

  async function handleEditSubSave() {
    if (!editingSub) return;
    setEditSubSaving(true);
    setEditSubError('');
    const res = await fetch(`/api/admin/teacher-subscriptions/${editingSub.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_date: editingSub.start_date,
        end_date: editingSub.end_date || null,
        cost: Number(editingSub.cost) || 0,
        notes: editingSub.notes || null,
        free_period_days: editingSub.free_period_days ?? 0,
        monthly_charge: editingSub.monthly_charge,
      }),
    });
    const data = await res.json();
    setEditSubSaving(false);
    if (!res.ok) {
      setEditSubError(data.error ?? 'Failed to save');
    } else {
      setSubs((prev) => prev.map((s) => s.id === data.id ? data : s));
      setEditingSub(null);
    }
  }

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
      body: JSON.stringify({ display_name: editing.display_name, phone: editing.phone || null }),
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
              {teacher.phone && <p className="text-xs text-gray-400">{teacher.phone}</p>}
              <p className="text-xs text-gray-400 mt-0.5">Booking link: /t/{teacher.id}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => handleImpersonate(teacher)}
                disabled={impersonating === teacher.id}
                className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50 disabled:opacity-50 transition-colors"
              >
                {impersonating === teacher.id ? 'Opening...' : 'Login as'}
              </button>
              <button
                onClick={() => openSubscriptions(teacher)}
                className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
              >
                Subscriptions
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

      {/* Subscriptions modal */}
      {subsTeacher && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Subscriptions</h3>
                <p className="text-xs text-gray-500">{subsTeacher.display_name} — {subsTeacher.email}</p>
              </div>
              <button onClick={() => setSubsTeacher(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Default monthly charge setting */}
            <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Default plan</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Default monthly charge (₪)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={defaultMonthlyCharge}
                    onChange={(e) => setDefaultMonthlyCharge(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <button
                  onClick={handleSaveDefaultCharge}
                  disabled={savingDefault}
                  className="mt-5 text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {savingDefault ? 'Saving...' : 'Save default'}
                </button>
              </div>
              <p className="text-xs text-blue-600">Subscriptions with no override will use this rate.</p>
            </div>

            {/* Add subscription form */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Add subscription</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={newSub.start_date}
                    onChange={(e) => setNewSub((s) => ({ ...s, start_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End date</label>
                  <input
                    type="date"
                    value={newSub.end_date}
                    onChange={(e) => setNewSub((s) => ({ ...s, end_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Free period (days)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={newSub.free_period_days}
                    onChange={(e) => setNewSub((s) => ({ ...s, free_period_days: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Monthly charge (₪) <span className="text-gray-400 font-normal">override</span></label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={newSub.monthly_charge}
                    onChange={(e) => setNewSub((s) => ({ ...s, monthly_charge: e.target.value }))}
                    placeholder={`default: ${defaultMonthlyCharge}`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cost (one-time)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={newSub.cost}
                    onChange={(e) => setNewSub((s) => ({ ...s, cost: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Notes</label>
                  <input
                    type="text"
                    value={newSub.notes}
                    onChange={(e) => setNewSub((s) => ({ ...s, notes: e.target.value }))}
                    placeholder="Optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {subError && <p className="text-sm text-red-600">{subError}</p>}
              <button
                onClick={handleAddSub}
                disabled={addingSub || !newSub.start_date}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addingSub ? 'Adding...' : 'Add subscription'}
              </button>
            </div>

            {/* Subscription list */}
            <div className="space-y-2">
              {subsLoading ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
              ) : subs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No subscriptions yet.</p>
              ) : subs.map((sub) => (
                <div key={sub.id} className="border border-gray-100 rounded-lg px-4 py-3 space-y-2">
                  {editingSub?.id === sub.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start date</label>
                          <input type="date" value={editingSub.start_date}
                            onChange={(e) => setEditingSub({ ...editingSub, start_date: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End date</label>
                          <input type="date" value={editingSub.end_date ?? ''}
                            onChange={(e) => setEditingSub({ ...editingSub, end_date: e.target.value || null })}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Free period (days)</label>
                          <input type="number" min={0} step={1} value={editingSub.free_period_days ?? 0}
                            onChange={(e) => setEditingSub({ ...editingSub, free_period_days: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Monthly charge (₪) <span className="text-gray-400 font-normal">override</span></label>
                          <input type="number" min={0} step={0.01}
                            value={editingSub.monthly_charge ?? ''}
                            onChange={(e) => setEditingSub({ ...editingSub, monthly_charge: e.target.value !== '' ? Number(e.target.value) : null })}
                            placeholder={`default: ${defaultMonthlyCharge}`}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Cost (one-time)</label>
                          <input type="number" min={0} step={0.01} value={editingSub.cost}
                            onChange={(e) => setEditingSub({ ...editingSub, cost: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Notes</label>
                          <input type="text" value={editingSub.notes ?? ''}
                            onChange={(e) => setEditingSub({ ...editingSub, notes: e.target.value || null })}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      {editSubError && <p className="text-xs text-red-600">{editSubError}</p>}
                      <div className="flex gap-2">
                        <button onClick={handleEditSubSave} disabled={editSubSaving}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                          {editSubSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => { setEditingSub(null); setEditSubError(''); }}
                          className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-800">
                            {sub.start_date} → {sub.end_date ?? 'ongoing'}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            sub.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {sub.free_period_days > 0 && `Free: ${sub.free_period_days}d · `}
                          {sub.monthly_charge != null
                            ? `₪${sub.monthly_charge}/mo`
                            : `₪${defaultMonthlyCharge}/mo (default)`}
                          {sub.cost > 0 && ` · Setup: ₪${sub.cost}`}
                          {sub.notes && ` · ${sub.notes}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <button onClick={() => { setEditingSub({ ...sub }); setEditSubError(''); }}
                          className="text-xs text-blue-600 hover:text-blue-800">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteSub(sub)}
                          className="text-xs text-red-500 hover:text-red-700">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
