import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

const TABLE_MAP: Record<string, string> = {
  homework: 'notebook_group_homework',
  notes: 'notebook_group_notes',
  resources: 'notebook_group_resources',
};

// PATCH /api/teacher/groups/[id]/notebook/[itemId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id, itemId } = await params;
  const body = await request.json();
  const { type, ...fields } = body;
  if (!type || !TABLE_MAP[type]) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from(TABLE_MAP[type])
    .update(fields)
    .eq('id', itemId)
    .eq('group_id', id)
    .eq('teacher_id', auth.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/teacher/groups/[id]/notebook/[itemId]?type=...
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id, itemId } = await params;
  const type = new URL(request.url).searchParams.get('type');
  if (!type || !TABLE_MAP[type]) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from(TABLE_MAP[type])
    .delete()
    .eq('id', itemId)
    .eq('group_id', id)
    .eq('teacher_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
