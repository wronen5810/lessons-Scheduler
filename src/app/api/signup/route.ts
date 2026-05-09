import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { whatsappAdminNewTeacherRequest } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  const { email, source } = await request.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const nameFromEmail = normalizedEmail.split('@')[0];

  const supabase = createServiceSupabase();

  // Find the active free plan (paid_months = 0) — filter in JS to avoid PostgREST type coercion issues
  const { data: activePlans } = await supabase
    .from('subscription_plans')
    .select('id, paid_months')
    .eq('status', 'active');

  const freePlanId = activePlans?.find(p => Number(p.paid_months) === 0)?.id ?? null;

  const { error } = await supabase.from('teacher_subscription_requests').insert({
    name: nameFromEmail,
    email: normalizedEmail,
    plan_id: freePlanId,
    comments: source ? `Landing page signup · ${source}` : 'Landing page signup',
  });

  if (error) {
    console.error('[signup] insert error:', error.message);
  }

  whatsappAdminNewTeacherRequest({ name: nameFromEmail, email: normalizedEmail, phone: null, comments: null }).catch((e) =>
    console.error('[signup] WhatsApp notify failed:', e)
  );

  return NextResponse.json({ ok: true });
}
