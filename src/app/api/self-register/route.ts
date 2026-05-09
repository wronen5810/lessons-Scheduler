import { NextRequest, NextResponse } from 'next/server';
import { createAuthSupabase, createServiceSupabase } from '@/lib/supabase-server';

// POST /api/self-register
// Idempotent: creates profiles + teacher_subscriptions for the current auth user.
// Called after signUp (password) or after OAuth callback.
// Safe to call multiple times — does nothing if profile already exists.
export async function POST(request: NextRequest) {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceSupabase();

  // Check if profile already exists
  const { data: existing } = await service
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ created: false });
  }

  // Determine display name: from request body, then OAuth metadata, then email prefix
  let name = '';
  try {
    const body = await request.json().catch(() => ({}));
    name = body.name?.trim() || '';
  } catch { /* ignore */ }
  if (!name) name = (user.user_metadata?.full_name as string | undefined)?.trim() ?? '';
  if (!name) name = user.email?.split('@')[0] ?? '';

  // Create profile
  const { error: profileError } = await service.from('profiles').insert({
    id: user.id,
    display_name: name,
    role: 'teacher',
    is_active: true,
  });

  if (profileError) {
    console.error('[self-register] profile insert error:', profileError.message);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }

  // Create 90-day free subscription
  const today = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { error: subError } = await service.from('teacher_subscriptions').insert({
    teacher_id: user.id,
    start_date: today,
    end_date: endDate,
    cost: 0,
    notes: 'Self-registered – 3 months free',
  });

  if (subError) {
    console.error('[self-register] subscription insert error:', subError.message);
    // Profile was created; don't fail the whole request over subscription
  }

  return NextResponse.json({ created: true }, { status: 201 });
}
