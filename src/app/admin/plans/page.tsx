'use client';

import { useEffect, useState } from 'react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  plan_type: 'new' | 'renewal' | 'both';
  free_months: number;
  paid_months: number;
  monthly_cost: number;
  status: 'active' | 'inactive';
  created_at: string;
}

type PlanStatus = 'active' | 'inactive';
type PlanType = 'new' | 'renewal' | 'both';
type PlanForm = { name: string; description: string; plan_type: PlanType; free_months: string; paid_months: string; monthly_cost: string; status: PlanStatus };
const emptyForm: PlanForm = { name: '', description: '', plan_type: 'new', free_months: '0', paid_months: '1', monthly_cost: '0', status: 'active' };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlan, setNewPlan] = useState<PlanForm>({ ...emptyForm });
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState<Plan | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/plans');
    setPlans(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!newPlan.name.trim()) { setFormError('Plan name is required'); return; }
    setAdding(true);
    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newPlan.name.trim(),
        description: newPlan.description.trim() || null,
        plan_type: newPlan.plan_type,
        free_months: Number(newPlan.free_months) || 0,
        paid_months: Number(newPlan.paid_months) || 1,
        monthly_cost: Number(newPlan.monthly_cost) || 0,
        status: newPlan.status,
      }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) { setFormError(data.error ?? 'Failed to create plan'); return; }
    setPlans((prev) => [data, ...prev]);
    setNewPlan({ ...emptyForm });
  }

  async function handleEditSave() {
    if (!editing) return;
    setEditSaving(true);
    setEditError('');
    const res = await fetch(`/api/admin/plans/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editing.name,
        description: editing.description || null,
        plan_type: editing.plan_type,
        free_months: editing.free_months,
        paid_months: editing.paid_months,
        monthly_cost: editing.monthly_cost,
        status: editing.status,
      }),
    });
    const data = await res.json();
    setEditSaving(false);
    if (!res.ok) { setEditError(data.error ?? 'Failed to save'); return; }
    setPlans((prev) => prev.map((p) => p.id === data.id ? data : p));
    setEditing(null);
  }

  async function handleDelete(plan: Plan) {
    if (!confirm(`Delete plan "${plan.name}"?`)) return;
    await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE' });
    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
  }

  async function toggleStatus(plan: Plan) {
    const next = plan.status === 'active' ? 'inactive' : 'active';
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...plan, status: next }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlans((prev) => prev.map((p) => p.id === data.id ? data : p));
    }
  }

  function planSummary(p: { free_months: number; paid_months: number; monthly_cost: number }) {
    const parts = [];
    if (p.free_months > 0) parts.push(`${p.free_months} month${p.free_months !== 1 ? 's' : ''} free`);
    parts.push(`then ₪${p.monthly_cost}/mo × ${p.paid_months} month${p.paid_months !== 1 ? 's' : ''}`);
    return parts.join(' · ');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Subscription Plans</h1>

      {/* Create plan form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">New Plan</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Plan name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={newPlan.name}
              onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Standard, Premium..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Description <span className="text-gray-400 font-normal">(shown to teachers)</span></label>
            <textarea
              value={newPlan.description}
              onChange={(e) => setNewPlan((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe what this plan includes..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Plan type</label>
            <select
              value={newPlan.plan_type}
              onChange={(e) => setNewPlan((p) => ({ ...p, plan_type: e.target.value as PlanType }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New teachers only</option>
              <option value="renewal">Renewal (existing teachers)</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Free months</label>
              <input
                type="number"
                min={0}
                step={1}
                value={newPlan.free_months}
                onChange={(e) => setNewPlan((p) => ({ ...p, free_months: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cost / month (₪)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={newPlan.monthly_cost}
                onChange={(e) => setNewPlan((p) => ({ ...p, monthly_cost: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Paid months</label>
              <input
                type="number"
                min={1}
                step={1}
                value={newPlan.paid_months}
                onChange={(e) => setNewPlan((p) => ({ ...p, paid_months: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select
              value={newPlan.status}
              onChange={(e) => setNewPlan((p) => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {adding ? 'Creating...' : 'Create plan'}
          </button>
        </form>
      </div>

      {/* Plans list */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No plans yet.</div>
        ) : plans.map((plan) => (
          <div key={plan.id} className="px-5 py-4">
            {editing?.id === plan.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Plan name</label>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Description <span className="text-gray-400 font-normal">(shown to teachers)</span></label>
                  <textarea
                    value={editing.description ?? ''}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value || null })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Plan type</label>
                  <select value={editing.plan_type}
                    onChange={(e) => setEditing({ ...editing, plan_type: e.target.value as PlanType })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="new">New teachers only</option>
                    <option value="renewal">Renewal (existing teachers)</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Free months</label>
                    <input type="number" min={0} step={1} value={editing.free_months}
                      onChange={(e) => setEditing({ ...editing, free_months: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Cost / month (₪)</label>
                    <input type="number" min={0} step={0.01} value={editing.monthly_cost}
                      onChange={(e) => setEditing({ ...editing, monthly_cost: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Paid months</label>
                    <input type="number" min={1} step={1} value={editing.paid_months}
                      onChange={(e) => setEditing({ ...editing, paid_months: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Status</label>
                  <select value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as 'active' | 'inactive' })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {editError && <p className="text-xs text-red-600">{editError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleEditSave} disabled={editSaving}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {editSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(null); setEditError(''); }}
                    className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                    <button
                      onClick={() => toggleStatus(plan)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                        plan.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {plan.status}
                    </button>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                      {plan.plan_type === 'new' ? 'New' : plan.plan_type === 'renewal' ? 'Renewal' : 'Both'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{planSummary(plan)}</p>
                  {plan.description && (
                    <p className="text-xs text-gray-500 mt-0.5 italic">{plan.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Total: ₪{(plan.monthly_cost * plan.paid_months).toFixed(0)} over {plan.free_months + plan.paid_months} months
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => { setEditing({ ...plan }); setEditError(''); }}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(plan)}
                    className="text-xs text-red-400 hover:text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
