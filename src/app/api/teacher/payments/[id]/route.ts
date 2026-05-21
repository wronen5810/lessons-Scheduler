import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// DELETE /api/teacher/payments/[id]
// Removes a payment. If it was allocated to a lesson, reverts the lesson from 'paid' → 'completed'.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();

  const { data: payment } = await supabase
    .from('student_payments')
    .select('id, booking_id, booking_type, teacher_id')
    .eq('id', id)
    .eq('teacher_id', auth.user.id)
    .single();

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  // If allocated to a lesson, revert lesson status to 'completed'
  if (payment.booking_id && payment.booking_type) {
    const table = payment.booking_type === 'recurring' ? 'recurring_bookings' : 'one_time_bookings';
    await supabase.from(table).update({ status: 'completed' }).eq('id', payment.booking_id).eq('teacher_id', auth.user.id);
  }

  const { error } = await supabase.from('student_payments').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
