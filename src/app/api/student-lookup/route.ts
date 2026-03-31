import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/student-lookup — find which teacher a student belongs to
export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('students')
    .select('teacher_id, is_active')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Email not found. Please contact your teacher.' }, { status: 404 });
  }
  if (!data.is_active) {
    return NextResponse.json({ error: 'Your account is inactive. Please contact your teacher.' }, { status: 403 });
  }

  return NextResponse.json({ teacher_id: data.teacher_id });
}
