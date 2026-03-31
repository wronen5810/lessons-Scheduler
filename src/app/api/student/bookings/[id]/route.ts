import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/student/bookings/[id]/cancel-request
// Student requests cancellation (requires reason). Teacher must approve.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { booking_type, email, reason } = await request.json();

  if (!booking_type || !email || !reason?.trim()) {
    return NextResponse.json({ error: 'booking_type, email and reason are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const table = booking_type === 'recurring' ? 'recurring_bookings' : 'one_time_bookings';

  // Verify this booking belongs to the requesting student
  const { data: booking } = await supabase
    .from(table)
    .select('id, status, student_email')
    .eq('id', id)
    .single();

  if (!booking || booking.student_email.toLowerCase() !== email.toLowerCase().trim()) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.status !== 'approved' && booking.status !== 'pending') {
    return NextResponse.json({ error: 'This booking cannot be cancelled' }, { status: 400 });
  }

  // Pending bookings can be withdrawn immediately; approved ones require teacher approval
  const newStatus = booking.status === 'pending' ? 'cancelled' : 'cancellation_requested';

  const { error } = await supabase
    .from(table)
    .update({ status: newStatus, cancellation_reason: reason.trim(), cancelled_by: 'student' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
