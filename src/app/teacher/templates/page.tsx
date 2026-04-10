'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SlotTemplate, OneTimeSlot } from '@/lib/types';
import TemplateManager from '@/components/TemplateManager';
import { formatTime, formatTimeDisplay, getEndTime, todayInIsrael } from '@/lib/dates';
import { useTeacherSettings } from '@/lib/useTeacherSettings';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [oneTimeSlots, setOneTimeSlots] = useState<OneTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { settings } = useTeacherSettings();

  // One-time slot form state
  const [showAdd, setShowAdd] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newHour, setNewHour] = useState(16);
  const [newMinute, setNewMinute] = useState(0);
  const [newDuration, setNewDuration] = useState(45);

  const newTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;

  const hourOptions = settings.time_format === '12h'
    ? Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i === 0 ? 12 : i} AM` })).concat(
        Array.from({ length: 12 }, (_, i) => ({ value: i + 12, label: `${i === 0 ? 12 : i} PM` }))
      )
    : Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }));

  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
    value: m, label: String(m).padStart(2, '0'),
  }));

  // Sync default duration from settings when loaded
  useEffect(() => { setNewDuration(settings.default_duration_minutes); }, [settings.default_duration_minutes]);
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  const today = todayInIsrael();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [tRes, oRes] = await Promise.all([
        fetch('/api/templates'),
        fetch(`/api/teacher/one-time-slots?from=${today}`),
      ]);
      if (!tRes.ok) { setError('Failed to load templates'); return; }
      setTemplates(await tRes.json());
      setOneTimeSlots(oRes.ok ? await oRes.json() : []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAddOneTime(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setSaving(true);
    const res = await fetch('/api/teacher/one-time-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specific_date: newDate, start_time: newTime, duration_minutes: newDuration }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error || 'Failed to add slot');
      return;
    }
    setShowAdd(false);
    setNewDate('');
    load();
  }

  async function deleteOneTimeSlot(id: string) {
    if (!confirm('Delete this one-time slot?')) return;
    await fetch(`/api/teacher/one-time-slots/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <Link href="/teacher" className="text-sm text-blue-600 hover:underline">&larr; Back</Link>
        <h1 className="text-lg font-semibold text-gray-900">Manage Slots</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-10">
        {loading && <div className="text-center text-gray-400">Loading...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">{error}</div>}

        {!loading && !error && (
          <>
            {/* Recurring slots */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Recurring Weekly Slots</h2>
              <TemplateManager templates={templates} onUpdate={load} defaultDuration={settings.default_duration_minutes} timeFormat={settings.time_format} />
            </section>

            {/* One-time slots */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">One-Time Slots</h2>
                <button
                  onClick={() => setShowAdd(true)}
                  className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add one-time slot
                </button>
              </div>

              {showAdd && (
                <form onSubmit={handleAddOneTime} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
                  <h3 className="text-sm font-medium text-blue-900">New one-time slot</h3>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        min={today}
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
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

              {oneTimeSlots.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No upcoming one-time slots.</p>
              ) : (
                <ul className="space-y-2">
                  {oneTimeSlots.map((s) => {
                    const start = formatTime(s.start_time);
                    const end = getEndTime(start, s.duration_minutes ?? 45);
                    return (
                      <li key={s.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{s.specific_date}</span>
                          <span className="text-sm text-gray-500 ml-2">{formatTimeDisplay(start, settings.time_format)} – {formatTimeDisplay(end, settings.time_format)}</span>
                          <span className="text-xs text-gray-400 ml-2">({s.duration_minutes ?? 45} min)</span>
                        </div>
                        <button onClick={() => deleteOneTimeSlot(s.id)} className="text-xs text-red-500 hover:text-red-700 underline">
                          Delete
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
