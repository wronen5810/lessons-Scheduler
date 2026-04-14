import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/teacher/groups/[id]/members — add a student to the group
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { student_id } = await request.json();
  if (!student_id) return NextResponse.json({ error: 'student_id is required' }, { status: 400 });

  const supabase = createServiceSupabase();

  // Verify the group belongs to this teacher
  const { data: group } = await supabase
    .from('student_groups')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  // Verify the student belongs to this teacher
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', student_id)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('student_group_members')
    .insert({ group_id: id, student_id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Student is already in this group' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
