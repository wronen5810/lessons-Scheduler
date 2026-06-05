// PATCH  /api/teacher/events/[id]
// DELETE /api/teacher/events/[id]

import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const { student_ids, grade, ...fields } = body as {
    student_ids?: string[];
    grade?: number;
    [key: string]: unknown;
  };

  const supabase = createServiceSupabase();

  // Verify ownership
  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', auth.user.id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Update event fields
  const { data, error } = await supabase
    .from('calendar_events')
    .update(fields)
    .eq('id', id)
    .eq('teacher_id', auth.user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-sync student assignments if provided
  if (student_ids !== undefined || grade !== undefined) {
    await supabase.from('calendar_event_students').delete().eq('event_id', id);

    let assignIds: string[] = student_ids ?? [];
    if (grade != null) {
      const { data: gradeStudents } = await supabase
        .from('students')
        .select('id')
        .eq('teacher_id', auth.user.id)
        .eq('grade', grade);
      const gradeIds = (gradeStudents ?? []).map((s) => s.id);
      assignIds = [...new Set([...assignIds, ...gradeIds])];
    }
    if (assignIds.length > 0) {
      await supabase
        .from('calendar_event_students')
        .insert(assignIds.map((sid) => ({ event_id: id, student_id: sid })));
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('teacher_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
