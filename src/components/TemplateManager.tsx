'use client';

import { useState } from 'react';
import { DAY_NAMES, formatTime, formatTimeDisplay, getEndTime } from '@/lib/dates';
import type { SlotTemplate } from '@/lib/types';

interface Props {
  templates: SlotTemplate[];
  onUpdate: () => void;
  defaultDuration?: number;
  timeFormat?: '24h' | '12h';
}

const DAY_OPTIONS = DAY_NAMES.map((name, i) => ({ value: i, label: name }));

export default function TemplateManager({ templates, onUpdate, defaultDuration = 45, timeFormat = '24h' }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newDay, setNewDay] = useState(0);
  const [newHour, setNewHour] = useState(16);
  const [newMinute, setNewMinute] = useState(0);
  const [newDuration, setNewDuration] = useState(defaultDuration);
  const [newTitle, setNewTitle] = useState('');
  const [newMaxParticipants, setNewMaxParticipants] = useState(1);

  const newTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;

  const hourOptions = timeFormat === '12h'
    ? Array.from({ length: 12 }, (_, i) => {
        const h = i === 0 ? 12 : i; // 12, 1, 2 ... 11
        const val = i; // 0–11
        return { value: val, label: `${h} AM` };
      }).concat(
        Array.from({ length: 12 }, (_, i) => {
          const h = i === 0 ? 12 : i;
          const val = i + 12;
          return { value: val, label: `${h} PM` };
        })
      )
    : Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }));

  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
    value: m,
    label: String(m).padStart(2, '0'),
  }));
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setSaving(true);

    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: newDay, start_time: newTime, duration_minutes: newDuration, title: newTitle.trim() || null, max_participants: newMaxParticipants }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error || 'Failed to add slot');
      return;
    }

    setShowAdd(false);
    setNewTitle('');
    setNewMaxParticipants(1);
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

          <div>
            <label className="block text-xs text-gray-600 mb-1">Title (optional)</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Group class, Piano lesson..."
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              <div className="flex gap-1">
                <select
                  value={newHour}
                  onChange={(e) => setNewHour(Number(e.target.value))}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {hourOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={newMinute}
                  onChange={(e) => setNewMinute(Number(e.target.value))}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {minuteOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
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

            <div className="w-24">
              <label className="block text-xs text-gray-600 mb-1">Max students</label>
              <input
                type="number"
                min={1}
                max={100}
                value={newMaxParticipants}
                onChange={(e) => setNewMaxParticipants(Math.max(1, Number(e.target.value)))}
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
              <li key={t.id} className="flex items-center justify-between rounded-lg border px-4 py-3 bg-white border-gray-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{DAY_NAMES[t.day_of_week]}</span>
                    <span className="text-sm text-gray-500">{formatTimeDisplay(start, timeFormat)} – {formatTimeDisplay(end, timeFormat)}</span>
                    <span className="text-xs text-gray-400">({t.duration_minutes ?? 45} min)</span>
                    {(t.max_participants ?? 1) > 1 && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{t.max_participants} max</span>
                    )}
                  </div>
                  {t.title && <div className="text-xs text-gray-500 mt-0.5">{t.title}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => deleteTemplate(t.id)} className="text-xs text-red-500 hover:text-red-700 underline">
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
