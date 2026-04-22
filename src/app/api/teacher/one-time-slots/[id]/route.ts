import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// PATCH /api/teacher/one-time-slots/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const allowed: Record<string, unknown> = {};
  if (body.start_time !== undefined) allowed.start_time = body.start_time;
  if (body.duration_minutes !== undefined) allowed.duration_minutes = Number(body.duration_minutes);
  if (body.title !== undefined) allowed.title = body.title || null;
  if (body.max_participants !== undefined) allowed.max_participants = Math.max(1, Number(body.max_participants));

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('one_time_slots')
    .update(allowed)
    .eq('id', id)
    .eq('teacher_id', auth.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/teacher/one-time-slots/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from('one_time_slots')
    .delete()
    .eq('id', id)
    .eq('teacher_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
