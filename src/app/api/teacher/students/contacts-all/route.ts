// GET /api/teacher/students/contacts-all
// Returns all contacts for all of the teacher's students in one request.

import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('student_contacts')
    .select('id, student_id, name, relationship, email, phone, is_primary')
    .eq('teacher_id', auth.user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
