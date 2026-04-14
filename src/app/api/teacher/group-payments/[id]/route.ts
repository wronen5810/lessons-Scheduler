import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// DELETE /api/teacher/group-payments/[id] — undo a student payment
// Reverts booking from 'paid' back to 'completed' if it was fully paid
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();
  const teacherId = auth.user.id;

  // Fetch the payment record first so we can revert the booking status
  const { data: payment } = await supabase
    .from('group_booking_payments')
    .select('booking_type, booking_id')
    .eq('id', id)
    .eq('teacher_id', teacherId)
    .single();

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  const { error } = await supabase
    .from('group_booking_payments')
    .delete()
    .eq('id', id)
    .eq('teacher_id', teacherId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Revert booking status from 'paid' back to 'completed'
  const table = payment.booking_type === 'recurring' ? 'recurring_bookings' : 'one_time_bookings';
  await supabase
    .from(table)
    .update({ status: 'completed' })
    .eq('id', payment.booking_id)
    .eq('teacher_id', teacherId)
    .eq('status', 'paid'); // only revert if it was marked fully paid

  return new NextResponse(null, { status: 204 });
}
