import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { computeWeekSlots } from '@/lib/slots';
import { formatDate, getWeekStart, todayInIsrael } from '@/lib/dates';
import { parseISO } from 'date-fns';

// GET /api/teacher/slots?week=YYYY-MM-DD
// Returns full slot details including student names for the teacher dashboard.
export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  let weekStr = searchParams.get('week');

  if (!weekStr) {
    const today = todayInIsrael();
    weekStr = formatDate(getWeekStart(parseISO(today)));
  }

  const supabase = createServiceSupabase();
  const slots = await computeWeekSlots(weekStr, supabase, true, auth.user.id);

  return NextResponse.json(slots);
}
