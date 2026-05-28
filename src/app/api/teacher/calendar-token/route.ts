// GET  /api/teacher/calendar-token  — returns { token, url } or { token: null, url: null }
// POST /api/teacher/calendar-token  — generate / regenerate token
// DELETE /api/teacher/calendar-token — revoke token

import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

function buildUrl(origin: string, token: string) {
  return `${origin}/api/calendar/${token}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from('teacher_settings')
    .select('calendar_token')
    .eq('teacher_id', auth.user.id)
    .single();

  const token = (data?.calendar_token as string | null) ?? null;
  const origin = new URL(request.url).origin;
  return NextResponse.json({ token, url: token ? buildUrl(origin, token) : null });
}

export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const token = crypto.randomUUID();
  const supabase = createServiceSupabase();

  await supabase
    .from('teacher_settings')
    .upsert({ teacher_id: auth.user.id, calendar_token: token }, { onConflict: 'teacher_id' });

  const origin = new URL(request.url).origin;
  return NextResponse.json({ token, url: buildUrl(origin, token) });
}

export async function DELETE() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  await supabase
    .from('teacher_settings')
    .update({ calendar_token: null })
    .eq('teacher_id', auth.user.id);

  return NextResponse.json({ ok: true });
}
