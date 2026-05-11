import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/auth/register
// Server-side teacher registration using the admin API.
// Creates the auth user with email_confirm: true (no confirmation email sent),
// then creates the profile and 90-day free subscription in the same request.
export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'email, password and name are required' }, { status: 400 });
  }

  const service = createServiceSupabase();

  // Create auth user — admin API skips the confirmation email entirely
  const { data: userData, error: createError } = await service.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    user_metadata: { full_name: name.trim() },
    email_confirm: true,
  });

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'email_taken' }, { status: 409 });
    }
    console.error('[register] create user error:', createError.message);
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  const user = userData.user;

  // Create profile
  const { error: profileError } = await service.from('profiles').insert({
    id: user.id,
    display_name: name.trim(),
    role: 'teacher',
    is_active: true,
  });

  if (profileError) {
    // If profile already exists that's fine; any other error is worth logging
    if (!profileError.message.includes('duplicate') && !profileError.message.includes('unique')) {
      console.error('[register] profile insert error:', profileError.message);
    }
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
    console.error('[register] subscription insert error:', subError.message);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
