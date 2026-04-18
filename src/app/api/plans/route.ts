import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/plans — public, returns active plans for the subscribe page
export async function GET() {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id, name, description, free_months, paid_months, monthly_cost')
    .eq('status', 'active')
    .order('monthly_cost', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
