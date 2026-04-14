import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// PATCH /api/teacher/groups/[id] — update group name/rate
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { name, rate } = await request.json();
  const supabase = createServiceSupabase();

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name.trim();
  if (rate !== undefined) update.rate = rate === '' ? null : rate;

  const { data, error } = await supabase
    .from('student_groups')
    .update(update)
    .eq('id', params.id)
    .eq('teacher_id', auth.user.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/teacher/groups/[id] — delete group
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from('student_groups')
    .delete()
    .eq('id', params.id)
    .eq('teacher_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
