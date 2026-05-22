import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { formatTime, getEndTime } from '@/lib/dates';

export interface ReceiptData {
  receipt_number: string;
  payment_id: string;
  issued_at: string;
  teacher: {
    name: string;
    email: string;
    phone: string | null;
    tutoring_area: string | null;
  };
  student: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  payment: {
    id: string;
    amount: number;
    note: string | null;
    paid_at: string;
    booking_id: string | null;
  };
  lesson: {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
}

async function generateReceiptNumber(supabase: ReturnType<typeof createServiceSupabase>, teacherId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from('student_payments')
    .select('receipt_number')
    .eq('teacher_id', teacherId)
    .like('receipt_number', `${year}-%`)
    .order('receipt_number', { ascending: false })
    .limit(1);

  let seq = 1;
  if (data && data.length > 0 && data[0].receipt_number) {
    const parts = (data[0].receipt_number as string).split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) seq = parsed + 1;
  }
  return `${year}-${String(seq).padStart(4, '0')}`;
}

// POST /api/teacher/receipts
// Body: { payment_id }
// Assigns a receipt number if not already assigned, returns full receipt data.
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { payment_id } = body as { payment_id: string };
  if (!payment_id) return NextResponse.json({ error: 'payment_id required' }, { status: 400 });

  const supabase = createServiceSupabase();

  // Fetch and verify the payment
  const { data: payment } = await supabase
    .from('student_payments')
    .select('id, student_id, amount, note, booking_type, booking_id, paid_at, receipt_number')
    .eq('id', payment_id)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  // Assign receipt number if not already assigned
  let receiptNumber: string = payment.receipt_number ?? '';
  if (!receiptNumber) {
    receiptNumber = await generateReceiptNumber(supabase, auth.user.id);
    await supabase
      .from('student_payments')
      .update({ receipt_number: receiptNumber })
      .eq('id', payment_id);
  }

  // Teacher profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phone, tutoring_area')
    .eq('id', auth.user.id)
    .single();

  // Student details
  const { data: student } = await supabase
    .from('students')
    .select('name, email, phone')
    .eq('id', payment.student_id)
    .single();

  // Lesson details for allocated payments
  let lesson: ReceiptData['lesson'] = null;
  if (payment.booking_id && payment.booking_type) {
    if (payment.booking_type === 'one_time') {
      const { data: booking } = await supabase
        .from('one_time_bookings')
        .select('specific_date, start_time, duration_minutes')
        .eq('id', payment.booking_id)
        .single();
      if (booking) {
        const st = formatTime(booking.start_time);
        lesson = { date: booking.specific_date, start_time: st, end_time: getEndTime(st, booking.duration_minutes ?? 45) };
      }
    } else {
      const { data: booking } = await supabase
        .from('recurring_bookings')
        .select('lesson_date, template_id')
        .eq('id', payment.booking_id)
        .single();
      if (booking) {
        const { data: tpl } = await supabase
          .from('slot_templates')
          .select('start_time, duration_minutes')
          .eq('id', booking.template_id)
          .single();
        if (tpl) {
          const st = formatTime(tpl.start_time);
          lesson = { date: booking.lesson_date, start_time: st, end_time: getEndTime(st, tpl.duration_minutes ?? 45) };
        }
      }
    }
  }

  const receiptData: ReceiptData = {
    receipt_number: receiptNumber,
    payment_id: payment.id,
    issued_at: new Date().toISOString(),
    teacher: {
      name: profile?.display_name ?? '',
      email: auth.user.email ?? '',
      phone: profile?.phone ?? null,
      tutoring_area: profile?.tutoring_area ?? null,
    },
    student: {
      name: student?.name ?? '',
      email: student?.email ?? null,
      phone: student?.phone ?? null,
    },
    payment: {
      id: payment.id,
      amount: Number(payment.amount),
      note: payment.note ?? null,
      paid_at: payment.paid_at,
      booking_id: payment.booking_id ?? null,
    },
    lesson,
  };

  return NextResponse.json(receiptData);
}
