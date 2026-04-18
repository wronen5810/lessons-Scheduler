import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/admin/plans
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/plans
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { name, free_months, paid_months, monthly_cost, status } = await request.json();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({
      name,
      free_months: free_months ?? 0,
      paid_months: paid_months ?? 1,
      monthly_cost: monthly_cost ?? 0,
      status: status ?? 'active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
