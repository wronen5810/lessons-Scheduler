import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teacher/student-logins?email=xxx (optional filter by student email)
export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  const supabase = createServiceSupabase();

  let query = supabase
    .from('student_logins')
    .select('id, student_email, student_name, logged_in_at')
    .eq('teacher_id', auth.user.id)
    .order('logged_in_at', { ascending: false })
    .limit(200);

  if (email) query = query.ilike('student_email', email);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
