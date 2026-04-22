import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// PATCH /api/templates/[id] — toggle is_active, optionally cancel future bookings from end_date
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceSupabase();

  const updates: Record<string, unknown> = {};
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.start_time !== undefined) updates.start_time = body.start_time;
  if (body.duration_minutes !== undefined) updates.duration_minutes = body.duration_minutes;
  if (body.title !== undefined) updates.title = body.title;
  if (body.max_participants !== undefined) updates.max_participants = body.max_participants;
  if (body.day_of_week !== undefined) updates.day_of_week = body.day_of_week;

  const { data, error } = await supabase
    .from('slot_templates')
    .update(updates)
    .eq('id', id)
    .eq('teacher_id', auth.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // When deactivating, cancel all future pending/approved bookings from end_date forward
  if (body.is_active === false && body.end_date) {
    await supabase
      .from('recurring_bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: 'teacher' })
      .eq('template_id', id)
      .eq('teacher_id', auth.user.id)
      .in('status', ['pending', 'approved'])
      .gte('lesson_date', body.end_date);
  }

  return NextResponse.json(data);
}

// DELETE /api/templates/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from('slot_templates')
    .delete()
    .eq('id', id)
    .eq('teacher_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
