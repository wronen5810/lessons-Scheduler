import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/admin/subscription-requests?status=pending|approved|rejected|all
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const status = new URL(request.url).searchParams.get('status') ?? 'pending';
  const supabase = createServiceSupabase();

  let query = supabase
    .from('teacher_subscription_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
