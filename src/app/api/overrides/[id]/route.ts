import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// DELETE /api/overrides/[id] — remove an override (restores default template behavior)
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from('slot_overrides')
    .delete()
    .eq('id', id)
    .eq('teacher_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
