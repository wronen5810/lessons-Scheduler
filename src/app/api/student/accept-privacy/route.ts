import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { issueStudentToken } from '@/lib/student-token';

// POST /api/student/accept-privacy
export async function POST(request: NextRequest) {
  const { email, teacherIds } = await request.json();
  if (!email || !Array.isArray(teacherIds) || teacherIds.length === 0) {
    return NextResponse.json({ error: 'email and teacherIds required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from('students')
    .update({ privacy_accepted_at: new Date().toISOString() })
    .ilike('email', normalizedEmail)
    .in('teacher_id', teacherIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tokens: Record<string, string> = {};
  for (const tid of teacherIds) {
    tokens[tid] = issueStudentToken(normalizedEmail, tid);
  }

  return NextResponse.json({ ok: true, tokens });
}
