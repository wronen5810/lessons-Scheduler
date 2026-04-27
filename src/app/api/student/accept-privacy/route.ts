import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { issueStudentToken } from '@/lib/student-token';

// POST /api/student/accept-privacy
export async function POST(request: NextRequest) {
  const { email, teacherIds } = await request.json();
  if (!email || !Array.isArray(teacherIds) || teacherIds.length === 0) {
    return NextResponse.json({ error: 'email and teacherIds required' }, { status: 400 });
  }

  const identifier = email.toLowerCase().trim();
  const isEmail = identifier.includes('@');
  const supabase = createServiceSupabase();

  let updateQuery = supabase
    .from('students')
    .update({ privacy_accepted_at: new Date().toISOString() })
    .in('teacher_id', teacherIds);
  updateQuery = isEmail
    ? updateQuery.ilike('email', identifier)
    : updateQuery.eq('phone', identifier);

  const { error } = await updateQuery;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tokens: Record<string, string> = {};
  for (const tid of teacherIds) {
    tokens[tid] = issueStudentToken(identifier, tid);
  }

  return NextResponse.json({ ok: true, tokens });
}
