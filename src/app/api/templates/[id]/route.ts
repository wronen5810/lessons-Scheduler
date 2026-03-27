import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// PATCH /api/templates/[id] — toggle is_active
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
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/templates/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();

  const { error } = await supabase.from('slot_templates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
