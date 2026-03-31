import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { computeWeekSlots } from '@/lib/slots';
import { formatDate, getWeekStart, todayInIsrael } from '@/lib/dates';
import { parseISO } from 'date-fns';

// GET /api/slots?week=YYYY-MM-DD&teacherId=<uuid>&studentEmail=<email>
// Returns slots for the student calendar view. Own bookings are included with their state.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');

  if (!teacherId) {
    return NextResponse.json({ error: 'teacherId is required' }, { status: 400 });
  }

  let weekStr = searchParams.get('week');

  if (!weekStr) {
    const today = todayInIsrael();
    weekStr = formatDate(getWeekStart(parseISO(today)));
  }

  const studentEmail = searchParams.get('studentEmail') ?? undefined;

  const supabase = createServiceSupabase();
  const slots = await computeWeekSlots(weekStr, supabase, false, teacherId, studentEmail);

  const studentStates = new Set(['available', 'pending', 'confirmed', 'cancellation_requested']);
  return NextResponse.json(slots.filter((s) => studentStates.has(s.state)));
}
