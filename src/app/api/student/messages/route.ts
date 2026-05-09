import { NextRequest, NextResponse } from 'next/server';
import { claimsFromRequest } from '@/lib/student-token';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/student/messages?teacherId=...
// Returns messages between this student and the specified teacher
export async function GET(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');
  if (!teacherId || teacherId !== claims.teacherId) {
    return NextResponse.json({ error: 'Invalid teacherId' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('messages')
    .select('id, direction, body, sent_at')
    .eq('teacher_id', teacherId)
    .eq('student_email', claims.email.toLowerCase())
    .order('sent_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/student/messages
// Student sends a message to their teacher (stored in DB + email to teacher)
export async function POST(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { teacherId, body } = await request.json();
  if (!teacherId || teacherId !== claims.teacherId) {
    return NextResponse.json({ error: 'Invalid teacherId' }, { status: 400 });
  }
  if (!body?.trim()) {
    return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Get student name and teacher email
  const [{ data: student }, { data: { user: teacherUser } }] = await Promise.all([
    supabase
      .from('students')
      .select('name')
      .eq('teacher_id', teacherId)
      .ilike('email', claims.email)
      .maybeSingle(),
    supabase.auth.admin.getUserById(teacherId),
  ]);

  const teacherEmail = teacherUser?.email;
  if (!teacherEmail) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  // Persist message
  const { error: insertErr } = await supabase.from('messages').insert({
    teacher_id: teacherId,
    student_email: claims.email.toLowerCase(),
    direction: 'to_teacher',
    body: body.trim(),
  });
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Email the teacher
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const studentName = student?.name ?? claims.email;
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: teacherEmail,
      reply_to: claims.email,
      subject: `Message from student ${studentName}`,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
          <p>Message from <strong>${studentName}</strong> (${claims.email}):</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;white-space:pre-wrap">${body.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      `,
    });
  } catch (e) {
    console.error('[student/messages] email to teacher failed:', e);
  }

  return NextResponse.json({ ok: true });
}
