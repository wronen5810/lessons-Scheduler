import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// DELETE /api/teacher/groups/[id]/members/[studentId] — remove a student from the group
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; studentId: string } }
) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();

  // Verify the group belongs to this teacher
  const { data: group } = await supabase
    .from('student_groups')
    .select('id')
    .eq('id', params.id)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const { error } = await supabase
    .from('student_group_members')
    .delete()
    .eq('group_id', params.id)
    .eq('student_id', params.studentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
