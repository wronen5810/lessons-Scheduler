import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { computeWeekSlots } from '@/lib/slots';
import { formatDate, getWeekStart, todayInIsrael } from '@/lib/dates';
import { parseISO } from 'date-fns';

// GET /api/slots?week=YYYY-MM-DD
// Returns available/unavailable slots for the student calendar view (no student details).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let weekStr = searchParams.get('week');

  if (!weekStr) {
    const today = todayInIsrael();
    weekStr = formatDate(getWeekStart(parseISO(today)));
  }

  const supabase = createServiceSupabase();
  const slots = await computeWeekSlots(weekStr, supabase, false);

  return NextResponse.json(slots.filter((s) => s.state === 'available'));
}
