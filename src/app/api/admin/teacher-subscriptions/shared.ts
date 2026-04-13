import type { SupabaseClient } from '@supabase/supabase-js';

export function computeStatus(sub: { start_date: string; end_date: string | null }): 'active' | 'inactive' {
  const today = new Date().toISOString().slice(0, 10);
  if (sub.start_date > today) return 'inactive';
  if (sub.end_date && sub.end_date < today) return 'inactive';
  return 'active';
}

// Returns an error string if overlap found, null if OK
export async function checkOverlap(
  supabase: SupabaseClient,
  teacherId: string,
  startDate: string,
  endDate: string | null,
  excludeId: string | null,
): Promise<string | null> {
  const { data } = await supabase
    .from('teacher_subscriptions')
    .select('id, start_date, end_date')
    .eq('teacher_id', teacherId);

  for (const existing of data ?? []) {
    if (excludeId && existing.id === excludeId) continue;
    const existEnd = existing.end_date ?? '9999-12-31';
    const newEnd = endDate ?? '9999-12-31';
    // Two ranges overlap if each starts before the other ends
    if (startDate <= existEnd && existing.start_date <= newEnd) {
      return `Dates overlap with existing subscription (${existing.start_date} → ${existing.end_date ?? 'ongoing'})`;
    }
  }
  return null;
}
