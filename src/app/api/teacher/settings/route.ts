import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { DEFAULT_NOTIFICATION_PREFERENCES, mergePrefs, type NotificationPreferences } from '@/lib/notifications';

export interface TeacherFeatures {
  billing: boolean;
  messages: boolean;
  groups: boolean;
  notebook: boolean;
  allow_cancellation: boolean;
}

const DEFAULT_FEATURES: TeacherFeatures = {
  billing: true,
  messages: true,
  groups: true,
  notebook: true,
  allow_cancellation: true,
};

function mergeFeatures(raw: unknown): TeacherFeatures {
  const f = (raw && typeof raw === 'object' ? raw : {}) as Partial<TeacherFeatures>;
  return {
    billing:            f.billing            ?? DEFAULT_FEATURES.billing,
    messages:           f.messages           ?? DEFAULT_FEATURES.messages,
    groups:             f.groups             ?? DEFAULT_FEATURES.groups,
    notebook:           f.notebook           ?? DEFAULT_FEATURES.notebook,
    allow_cancellation: f.allow_cancellation ?? DEFAULT_FEATURES.allow_cancellation,
  };
}

export interface TeacherSettings {
  default_duration_minutes: number;
  time_format: '24h' | '12h';
  notification_preferences: NotificationPreferences;
  features: TeacherFeatures;
}

const DEFAULTS: TeacherSettings = {
  default_duration_minutes: 45,
  time_format: '24h',
  notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  features: DEFAULT_FEATURES,
};

export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from('teacher_settings')
    .select('default_duration_minutes, time_format, notification_preferences, features')
    .eq('teacher_id', auth.user.id)
    .single();

  if (!data) return NextResponse.json(DEFAULTS);

  return NextResponse.json({
    ...data,
    notification_preferences: mergePrefs(data.notification_preferences),
    features: mergeFeatures(data.features),
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const update: Record<string, unknown> = {};

  if (body.default_duration_minutes !== undefined) {
    const d = Number(body.default_duration_minutes);
    if (!Number.isInteger(d) || d < 15 || d > 180) {
      return NextResponse.json({ error: 'Duration must be between 15 and 180 minutes' }, { status: 400 });
    }
    update.default_duration_minutes = d;
  }

  if (body.time_format !== undefined) {
    if (!['24h', '12h'].includes(body.time_format)) {
      return NextResponse.json({ error: 'time_format must be 24h or 12h' }, { status: 400 });
    }
    update.time_format = body.time_format;
  }

  if (body.notification_preferences !== undefined) {
    update.notification_preferences = mergePrefs(body.notification_preferences);
  }

  if (body.features !== undefined) {
    update.features = mergeFeatures(body.features);
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('teacher_settings')
    .upsert({ teacher_id: auth.user.id, ...update, updated_at: new Date().toISOString() })
    .select('default_duration_minutes, time_format, notification_preferences, features')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    ...data,
    notification_preferences: mergePrefs(data.notification_preferences),
    features: mergeFeatures(data.features),
  });
}
