import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { computeStatus, checkOverlap } from './shared';

// GET /api/admin/teacher-subscriptions?teacher_id=
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const teacherId = new URL(request.url).searchParams.get('teacher_id');
  if (!teacherId) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('teacher_subscriptions')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('start_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((s) => ({ ...s, status: computeStatus(s) })));
}

// POST /api/admin/teacher-subscriptions
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { teacher_id, start_date, end_date, cost, notes, free_period_days, monthly_charge } = await request.json();
  if (!teacher_id || !start_date) {
    return NextResponse.json({ error: 'teacher_id and start_date are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const overlapError = await checkOverlap(supabase, teacher_id, start_date, end_date || null, null);
  if (overlapError) return NextResponse.json({ error: overlapError }, { status: 409 });

  const { data, error } = await supabase
    .from('teacher_subscriptions')
    .insert({
      teacher_id,
      start_date,
      end_date: end_date || null,
      cost: cost ?? 0,
      notes: notes?.trim() || null,
      free_period_days: free_period_days ?? 0,
      monthly_charge: monthly_charge != null && monthly_charge !== '' ? Number(monthly_charge) : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, status: computeStatus(data) }, { status: 201 });
}
