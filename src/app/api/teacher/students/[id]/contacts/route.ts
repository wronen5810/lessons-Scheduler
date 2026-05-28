// GET  /api/teacher/students/[id]/contacts — list contacts for a student
// POST /api/teacher/students/[id]/contacts — add a contact

import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id: studentId } = await params;
  const supabase = createServiceSupabase();

  // Verify the student belongs to this teacher
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('student_contacts')
    .select('*')
    .eq('student_id', studentId)
    .eq('teacher_id', auth.user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id: studentId } = await params;
  const body = await request.json();
  const { name, relationship, email, phone, is_primary } = body as {
    name: string;
    relationship?: string;
    email?: string;
    phone?: string;
    is_primary?: boolean;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Verify student ownership
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // If marking as primary, clear any existing primary first
  if (is_primary) {
    await supabase
      .from('student_contacts')
      .update({ is_primary: false })
      .eq('student_id', studentId)
      .eq('teacher_id', auth.user.id)
      .eq('is_primary', true);
  }

  const { data, error } = await supabase
    .from('student_contacts')
    .insert({
      student_id: studentId,
      teacher_id: auth.user.id,
      name: name.trim(),
      relationship: relationship?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      is_primary: is_primary ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
