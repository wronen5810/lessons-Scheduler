import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teacher/payments?student_id=<uuid>
// Returns all payments for the teacher, optionally filtered by student.
export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const studentId = request.nextUrl.searchParams.get('student_id');

  let query = supabase
    .from('student_payments')
    .select('id, student_id, amount, note, booking_type, booking_id, paid_at')
    .eq('teacher_id', auth.user.id)
    .order('paid_at', { ascending: false });

  if (studentId) query = query.eq('student_id', studentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/teacher/payments
// Body: { student_id, amount, note? }
// Records an unallocated payment (no lesson attached).
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { student_id, amount, note } = body as { student_id: string; amount: number; note?: string };

  if (!student_id || !amount || amount <= 0) {
    return NextResponse.json({ error: 'student_id and amount are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Verify the student belongs to this teacher
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', student_id)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('student_payments')
    .insert({
      teacher_id: auth.user.id,
      student_id,
      amount,
      note: note || null,
      booking_id: null,
      booking_type: null,
    })
    .select('id, student_id, amount, note, booking_type, booking_id, paid_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
