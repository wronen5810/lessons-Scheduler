import { useEffect, useState } from 'react';
import type { TeacherSettings } from '@/app/api/teacher/settings/route';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications';

const DEFAULTS: TeacherSettings = {
  default_duration_minutes: 45,
  time_format: '24h',
  notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
};

export function useTeacherSettings() {
  const [settings, setSettings] = useState<TeacherSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/teacher/settings');
    if (res.ok) setSettings(await res.json());
    setLoading(false);
  }

  async function save(updates: Partial<TeacherSettings>): Promise<TeacherSettings> {
    const res = await fetch('/api/teacher/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok) setSettings(data);
    return data;
  }

  useEffect(() => { load(); }, []);

  return { settings, loading, save, reload: load };
}
