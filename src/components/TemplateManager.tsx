'use client';

import { useState } from 'react';
import { DAY_NAMES, formatTime, getEndTime, todayInIsrael } from '@/lib/dates';
import type { SlotTemplate } from '@/lib/types';

interface Props {
  templates: SlotTemplate[];
  onUpdate: () => void;
}

const DAY_OPTIONS = DAY_NAMES.map((name, i) => ({ value: i, label: name }));

export default function TemplateManager({ templates, onUpdate }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newDay, setNewDay] = useState(0);
  const [newTime, setNewTime] = useState('16:00');
  const [newDuration, setNewDuration] = useState(45);
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<SlotTemplate | null>(null);
  const [endDate, setEndDate] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  const today = todayInIsrael();

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    await fetch(`/api/templates/${deactivateTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false, end_date: endDate || undefined }),
    });
    setDeactivating(false);
    setDeactivateTarget(null);
    setEndDate('');
    onUpdate();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setSaving(true);

    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: newDay, start_time: newTime, duration_minutes: newDuration }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error || 'Failed to add slot');
      return;
    }

    setShowAdd(false);
    onUpdate();
  }

  async function activate(template: SlotTemplate) {
    await fetch(`/api/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true }),
    });
    onUpdate();
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this slot? All future occurrences will be removed from the schedule.')) return;
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">These slots repeat every week.</p>
        <button
          onClick={() => setShowAdd(true)}
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add slot
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
          <h3 className="text-sm font-medium text-blue-900">New recurring slot</h3>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Day</label>
              <select
                value={newDay}
                onChange={(e) => setNewDay(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Start time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-28">
              <label className="block text-xs text-gray-600 mb-1">Duration (min)</label>
              <input
                type="number"
                min={15}
                max={180}
                step={5}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {addError && <p className="text-xs text-red-600">{addError}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setAddError(''); }} className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {templates.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No slots defined yet.</p>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => {
            const start = formatTime(t.start_time);
            const end = getEndTime(start, t.duration_minutes ?? 45);
            return (
              <li key={t.id} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${t.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                <div>
                  <span className="text-sm font-medium text-gray-900">{DAY_NAMES[t.day_of_week]}</span>
                  <span className="text-sm text-gray-500 ml-2">{start} – {end}</span>
                  <span className="text-xs text-gray-400 ml-2">({t.duration_minutes ?? 45} min)</span>
                  {!t.is_active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
                </div>
                <div className="flex items-center gap-3">
                  {t.is_active
                    ? <button onClick={() => { setDeactivateTarget(t); setEndDate(today); }} className="text-xs text-gray-500 hover:text-gray-700 underline">Deactivate</button>
                    : <button onClick={() => activate(t)} className="text-xs text-gray-500 hover:text-gray-700 underline">Activate</button>
                  }
                  <button onClick={() => deleteTemplate(t.id)} className="text-xs text-red-500 hover:text-red-700 underline">
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {/* Deactivate modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Deactivate slot</h3>
            <p className="text-sm text-gray-500">
              Cancel all pending/approved lessons for <strong>{DAY_NAMES[deactivateTarget.day_of_week]} {formatTime(deactivateTarget.start_time)}</strong> from which date onward?
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cancel from date</label>
              <input
                type="date"
                min={today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={confirmDeactivate} disabled={deactivating}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deactivating ? 'Deactivating...' : 'Deactivate'}
              </button>
              <button onClick={() => { setDeactivateTarget(null); setEndDate(''); }}
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
