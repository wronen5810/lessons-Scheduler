import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/teacher/accept-policies — records the timestamp when teacher accepted policies
export async function POST() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const now = new Date().toISOString();

  // Get current features to preserve existing flags
  const { data: current } = await supabase
    .from('teacher_settings')
    .select('features')
    .eq('teacher_id', auth.user.id)
    .single();

  const existingFeatures = (current?.features ?? {}) as Record<string, unknown>;

  await supabase
    .from('teacher_settings')
    .upsert({
      teacher_id: auth.user.id,
      features: { ...existingFeatures, policies_accepted_at: now },
      updated_at: now,
    });

  return NextResponse.json({ ok: true, policies_accepted_at: now });
}
