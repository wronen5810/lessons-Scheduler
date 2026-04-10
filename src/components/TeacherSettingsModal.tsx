'use client';

import { useState } from 'react';
import type { TeacherSettings } from '@/app/api/teacher/settings/route';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationChannel,
  type NotificationKey,
  type NotificationPreferences,
} from '@/lib/notifications';

interface Props {
  settings: TeacherSettings;
  onSave: (updates: Partial<TeacherSettings>) => Promise<TeacherSettings>;
  onClose: () => void;
}

const NOTIFICATION_ROWS: { key: NotificationKey; label: string; direction: string }[] = [
  { key: 'lesson_request',   label: 'New lesson request',   direction: '→ you' },
  { key: 'lesson_approved',  label: 'Lesson approved',      direction: '→ student' },
  { key: 'lesson_rejected',  label: 'Lesson rejected',      direction: '→ student' },
  { key: 'lesson_cancelled', label: 'Lesson cancelled',     direction: '→ student' },
  { key: 'lesson_reminder',  label: 'Lesson reminder',      direction: '→ student' },
  { key: 'access_request',   label: 'New student request',  direction: '→ you' },
];

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string }[] = [
  { value: 'email',     label: 'Email' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'both',      label: 'Email + WhatsApp' },
  { value: 'off',       label: 'Off' },
];

export default function TeacherSettingsModal({ settings, onSave, onClose }: Props) {
  const [duration, setDuration] = useState(settings.default_duration_minutes);
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>(settings.time_format);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...settings.notification_preferences,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setChannel(key: NotificationKey, value: NotificationChannel) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const result = await onSave({
      default_duration_minutes: duration,
      time_format: timeFormat,
      notification_preferences: prefs,
    });
    setSaving(false);
    if ('error' in result) {
      setError((result as { error: string }).error);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Default lesson duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default lesson duration</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={15}
              max={180}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">minutes</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Used when creating new slots.</p>
        </div>

        {/* Time format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time format</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="timeFormat" value="24h" checked={timeFormat === '24h'} onChange={() => setTimeFormat('24h')} className="accent-blue-600" />
              <span className="text-sm text-gray-700">24-hour <span className="text-gray-400">(14:30)</span></span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="timeFormat" value="12h" checked={timeFormat === '12h'} onChange={() => setTimeFormat('12h')} className="accent-blue-600" />
              <span className="text-sm text-gray-700">12-hour <span className="text-gray-400">(2:30 PM)</span></span>
            </label>
          </div>
        </div>

        {/* Notification preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notifications</label>
          <p className="text-xs text-gray-400 mb-3">WhatsApp to student requires their phone number on file.</p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_auto] bg-gray-50 px-3 py-2 border-b border-gray-200">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Channel</span>
            </div>
            {NOTIFICATION_ROWS.map((row, i) => (
              <div
                key={row.key}
                className={`grid grid-cols-[1fr_auto] items-center px-3 py-2.5 gap-4 ${i < NOTIFICATION_ROWS.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div>
                  <span className="text-sm text-gray-800">{row.label}</span>
                  <span className="text-xs text-gray-400 ml-1.5">{row.direction}</span>
                </div>
                <select
                  value={prefs[row.key]}
                  onChange={(e) => setChannel(row.key, e.target.value as NotificationChannel)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CHANNEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
