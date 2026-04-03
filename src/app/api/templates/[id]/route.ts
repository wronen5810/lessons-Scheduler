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

  const { data, error } = await supabase
    .from('slot_templates')
    .update({ is_active: body.is_active })
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
