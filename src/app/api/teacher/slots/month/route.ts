import { addDays, parseISO } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { computeRangeSlots } from '@/lib/slots';
import { formatDate, getMonthStr, getMonthWeekStarts, todayInIsrael } from '@/lib/dates';

// GET /api/teacher/slots/month?month=YYYY-MM
// Loads all slots for the full calendar month in a single DB pass (6 queries)
// instead of one pass per week (6 × 4-5 queries).
export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const monthStr = searchParams.get('month') ?? getMonthStr(todayInIsrael());

  const weeks = getMonthWeekStarts(monthStr);
  const startStr = weeks[0];
  const endStr = formatDate(addDays(parseISO(weeks[weeks.length - 1]), 6));

  const supabase = createServiceSupabase();
  const slots = await computeRangeSlots(startStr, endStr, supabase, true, auth.user.id);

  return NextResponse.json(slots);
}
