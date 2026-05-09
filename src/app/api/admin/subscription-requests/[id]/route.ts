import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';
import { emailTeacherWelcome } from '@/lib/email';

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function subtractDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// PATCH /api/admin/subscription-requests/[id]
// body: { action: 'approve' | 'reject', display_name?: string }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { action, display_name } = await request.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const { data: req } = await supabase
    .from('teacher_subscription_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  if (action === 'reject') {
    await supabase.from('teacher_subscription_requests').update({ status: 'rejected' }).eq('id', id);
    return NextResponse.json({ ok: true });
  }

  // ── Approve: create teacher account ──────────────────────────────
  const tempPassword = randomBytes(16).toString('hex');
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email: req.email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !user) {
    return NextResponse.json({ error: createError?.message ?? 'Failed to create user' }, { status: 500 });
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    role: 'teacher',
    display_name: display_name || req.name,
    phone: req.phone || null,
    is_active: true,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // ── Create subscriptions based on plan ───────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  if (req.plan_id) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', req.plan_id)
      .single();

    if (plan) {
      const isFree = plan.paid_months === 0;

      if (isFree) {
        // Free plan: one 3-month subscription at no cost
        const freeEnd = subtractDay(addMonths(today, 3));
        await supabase.from('teacher_subscriptions').insert({
          teacher_id: user.id,
          start_date: today,
          end_date: freeEnd,
          cost: 0,
          monthly_charge: 0,
          free_period_days: 0,
          notes: `Free plan · Plan: ${plan.name}`,
        });
      } else if (plan.free_months > 0) {
        // Paid plan with a free trial period
        const freeEnd = subtractDay(addMonths(today, plan.free_months));
        await supabase.from('teacher_subscriptions').insert({
          teacher_id: user.id,
          start_date: today,
          end_date: freeEnd,
          cost: 0,
          monthly_charge: 0,
          free_period_days: 0,
          notes: `Free period · Plan: ${plan.name}`,
        });

        const paidStart = addMonths(today, plan.free_months);
        const paidEnd = subtractDay(addMonths(paidStart, plan.paid_months));
        await supabase.from('teacher_subscriptions').insert({
          teacher_id: user.id,
          start_date: paidStart,
          end_date: paidEnd,
          cost: plan.monthly_cost * plan.paid_months,
          monthly_charge: plan.monthly_cost,
          free_period_days: 0,
          notes: `Paid period · Plan: ${plan.name}`,
        });
      } else {
        // Paid plan with no trial — single subscription starting today
        const paidEnd = subtractDay(addMonths(today, plan.paid_months));
        await supabase.from('teacher_subscriptions').insert({
          teacher_id: user.id,
          start_date: today,
          end_date: paidEnd,
          cost: plan.monthly_cost * plan.paid_months,
          monthly_charge: plan.monthly_cost,
          free_period_days: 0,
          notes: `Plan: ${plan.name}`,
        });
      }
    }
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '').trim();
  const teacherName = display_name || req.name;

  // Generate a one-time setup token (valid 48 h) and store it on the profile
  const setupToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { error: tokenSaveError } = await supabase
    .from('profiles')
    .update({ setup_token: setupToken, setup_token_expires_at: expiresAt })
    .eq('id', user.id);

  if (tokenSaveError) {
    console.error('[approval] Failed to save setup token — run add_setup_token.sql migration:', tokenSaveError.message);
  }

  const setPasswordLink = `${baseUrl}/teacher/set-password?token=${setupToken}`;

  // Send welcome email
  let emailError: string | null = null;
  try {
    await emailTeacherWelcome({ teacherName, teacherEmail: req.email, setPasswordLink });
  } catch (e) {
    emailError = e instanceof Error ? e.message : String(e);
    console.error('[approval] welcome email failed:', emailError);
  }

  await supabase.from('teacher_subscription_requests').update({ status: 'approved' }).eq('id', id);

  return NextResponse.json({ ok: true, teacher_id: user.id, email_error: emailError });
}
