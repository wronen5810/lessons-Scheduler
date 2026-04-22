'use client';

import { useState } from 'react';

interface Props {
  date: string;
  defaultDuration: number;
  timeFormat: '24h' | '12h';
  onClose: () => void;
  onSaved: () => void;
}

export default function AddSlotModal({ date, defaultDuration, timeFormat, onClose, onSaved }: Props) {
  const [hour, setHour] = useState(16);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState(defaultDuration);
  const [title, setTitle] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hourOptions = timeFormat === '12h'
    ? Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i === 0 ? 12 : i} AM` })).concat(
        Array.from({ length: 12 }, (_, i) => ({ value: i + 12, label: `${i === 0 ? 12 : i} PM` }))
      )
    : Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }));

  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
    value: m, label: String(m).padStart(2, '0'),
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const res = await fetch('/api/teacher/one-time-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specific_date: date, start_time: startTime, duration_minutes: duration, title: title.trim() || null, max_participants: maxParticipants }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to add slot');
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Add slot — {date}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Title (optional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Piano lesson..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Start time</label>
            <div className="flex gap-2">
              <select value={hour} onChange={(e) => setHour(Number(e.target.value))}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {hourOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={minute} onChange={(e) => setMinute(Number(e.target.value))}
                className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {minuteOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Duration (min)</label>
              <input type="number" min={15} max={180} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Max students</label>
              <input type="number" min={1} max={100} value={maxParticipants} onChange={(e) => setMaxParticipants(Math.max(1, Number(e.target.value)))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Add slot'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
