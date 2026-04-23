'use client';

import { useState } from 'react';
import type { TeacherSettings, TeacherFeatures } from '@/app/api/teacher/settings/route';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationChannels,
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

export default function TeacherSettingsModal({ settings, onSave, onClose }: Props) {
  const [duration, setDuration] = useState(settings.default_duration_minutes);
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>(settings.time_format);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...settings.notification_preferences,
  });
  const [features, setFeatures] = useState<TeacherFeatures>({
    billing:  settings.features?.billing  ?? true,
    messages: settings.features?.messages ?? true,
    groups:   settings.features?.groups   ?? true,
    notebook: settings.features?.notebook ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleChannel(key: NotificationKey, channel: keyof NotificationChannels) {
    setPrefs((p) => ({
      ...p,
      [key]: { ...p[key], [channel]: !p[key][channel] },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const result = await onSave({
      default_duration_minutes: duration,
      time_format: timeFormat,
      notification_preferences: prefs,
      features,
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ms-1">&times;</button>
          </div>
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

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
          <p className="text-xs text-gray-400 mb-3">Hide features you don't need from the menu and student screen.</p>
          <div className="space-y-2">
            {([
              { key: 'billing',  label: 'Billing',   desc: 'Billing page in menu' },
              { key: 'messages', label: 'Messages',  desc: 'Messages page in menu' },
              { key: 'groups',   label: 'Groups',    desc: 'Groups tab in student screen' },
              { key: 'notebook', label: 'Notebook',  desc: 'Student notebook (tasks, notes, resources, grades)' },
            ] as { key: keyof TeacherFeatures; label: string; desc: string }[]).map(({ key, label, desc }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={features[key]}
                  onChange={(e) => setFeatures((f) => ({ ...f, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <span className="text-sm text-gray-800">{label} <span className="text-xs text-gray-400">— {desc}</span></span>
              </label>
            ))}
          </div>
        </div>

        {/* Notification preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notifications</label>
          <p className="text-xs text-gray-400 mb-3">WhatsApp/push to student requires their phone or app install.</p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_48px_64px_48px] bg-gray-50 px-3 py-2 border-b border-gray-200 gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center">Email</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center">WhatsApp</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center">Push</span>
            </div>
            {NOTIFICATION_ROWS.map((row, i) => (
              <div
                key={row.key}
                className={`grid grid-cols-[1fr_48px_64px_48px] items-center px-3 py-2.5 gap-2 ${i < NOTIFICATION_ROWS.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div>
                  <span className="text-sm text-gray-800">{row.label}</span>
                  <span className="text-xs text-gray-400 ml-1.5">{row.direction}</span>
                </div>
                {(['email', 'whatsapp', 'push'] as const).map((ch) => (
                  <div key={ch} className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={prefs[row.key][ch]}
                      onChange={() => toggleChannel(row.key, ch)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
