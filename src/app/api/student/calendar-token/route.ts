import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { claimsFromRequest } from '@/lib/student-token';
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

function baseUrl(req: NextRequest): string {
  const host = req.headers.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}

function tokenUrl(base: string, token: string): string {
  return `${base}/api/student-calendar/${token}`;
}

// GET /api/student/calendar-token — returns { token, url } or { token: null, url: null }
export async function GET(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceSupabase();
  const isEmail = claims.email.includes('@');
  let q = supabase.from('students').select('calendar_token').eq('teacher_id', claims.teacherId);
  q = isEmail ? q.ilike('email', claims.email) : q.eq('phone', claims.email);
  const { data: student } = await q.maybeSingle();

  if (!student) return NextResponse.json({ token: null, url: null });

  const token: string | null = student.calendar_token ?? null;
  return NextResponse.json({
    token,
    url: token ? tokenUrl(baseUrl(request), token) : null,
  });
}

// POST /api/student/calendar-token — generates a new token
export async function POST(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceSupabase();
  const newToken = randomUUID();

  const isEmail = claims.email.includes('@');
  let q = supabase.from('students').select('id').eq('teacher_id', claims.teacherId);
  q = isEmail ? q.ilike('email', claims.email) : q.eq('phone', claims.email);
  const { data: student } = await q.maybeSingle();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  await supabase.from('students').update({ calendar_token: newToken }).eq('id', student.id);

  return NextResponse.json({
    token: newToken,
    url: tokenUrl(baseUrl(request), newToken),
  });
}

// DELETE /api/student/calendar-token — revokes the token
export async function DELETE(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceSupabase();
  const isEmail = claims.email.includes('@');
  let q = supabase.from('students').select('id').eq('teacher_id', claims.teacherId);
  q = isEmail ? q.ilike('email', claims.email) : q.eq('phone', claims.email);
  const { data: student } = await q.maybeSingle();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  await supabase.from('students').update({ calendar_token: null }).eq('id', student.id);
  return NextResponse.json({ ok: true });
}
