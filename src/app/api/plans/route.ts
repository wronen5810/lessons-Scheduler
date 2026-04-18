import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/plans — public, returns active plans for the subscribe page
// Optional ?type=new|renewal to filter by plan_type (also includes 'both' plans)
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type'); // 'new' | 'renewal' | null

  const supabase = createServiceSupabase();
  let query = supabase
    .from('subscription_plans')
    .select('id, name, description, plan_type, free_months, paid_months, monthly_cost')
    .eq('status', 'active')
    .order('monthly_cost', { ascending: true });

  if (type === 'new') query = query.in('plan_type', ['new', 'both']);
  else if (type === 'renewal') query = query.in('plan_type', ['renewal', 'both']);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
