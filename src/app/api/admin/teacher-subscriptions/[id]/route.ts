import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { computeStatus, checkOverlap } from '../shared';

// PATCH /api/admin/teacher-subscriptions/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { start_date, end_date, cost, notes, free_period_days, monthly_charge } = await request.json();
  if (!start_date) return NextResponse.json({ error: 'start_date is required' }, { status: 400 });

  const supabase = createServiceSupabase();

  const { data: existing } = await supabase
    .from('teacher_subscriptions')
    .select('teacher_id')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const overlapError = await checkOverlap(supabase, existing.teacher_id, start_date, end_date || null, id);
  if (overlapError) return NextResponse.json({ error: overlapError }, { status: 409 });

  const { data, error } = await supabase
    .from('teacher_subscriptions')
    .update({
      start_date,
      end_date: end_date || null,
      cost: cost ?? 0,
      notes: notes?.trim() || null,
      free_period_days: free_period_days ?? 0,
      monthly_charge: monthly_charge != null && monthly_charge !== '' ? Number(monthly_charge) : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, status: computeStatus(data) });
}

// DELETE /api/admin/teacher-subscriptions/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();
  const { error } = await supabase.from('teacher_subscriptions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
