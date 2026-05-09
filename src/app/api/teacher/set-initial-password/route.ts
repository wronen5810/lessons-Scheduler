import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teacher/set-initial-password?token=... — validate token, return profile hints
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('setup_token_expires_at, display_name, phone')
    .eq('setup_token', token)
    .single();

  if (!profile) return NextResponse.json({ valid: false });

  if (profile.setup_token_expires_at && new Date(profile.setup_token_expires_at) < new Date()) {
    return NextResponse.json({ valid: false });
  }

  // Name needs update if it has no space (came from email prefix like "jane")
  const needsName = !profile.display_name || !profile.display_name.trim().includes(' ');
  const needsPhone = !profile.phone;

  return NextResponse.json({ valid: true, needsName, needsPhone });
}

// POST /api/teacher/set-initial-password — public, token-gated
// Body: { token: string, password: string, name?: string, phone?: string }
export async function POST(request: NextRequest) {
  const { token, password, name, phone } = await request.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Look up the token
  const { data: profile, error: lookupError } = await supabase
    .from('profiles')
    .select('id, setup_token, setup_token_expires_at')
    .eq('setup_token', token)
    .single();

  if (lookupError) {
    const msg = lookupError.message ?? '';
    // Column missing = migration not applied yet
    if (msg.includes('column') || msg.includes('does not exist')) {
      console.error('[set-password] setup_token column missing — run add_setup_token.sql in Supabase');
      return NextResponse.json({ error: 'Setup not configured. Please contact your administrator.' }, { status: 500 });
    }
    console.error('[set-password] token lookup error:', msg);
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }

  if (profile.setup_token_expires_at && new Date(profile.setup_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired. Please contact your administrator.' }, { status: 400 });
  }

  // Set the password using the admin API
  const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, { password });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Invalidate the token and optionally update name/phone
  const profileUpdate: Record<string, unknown> = { setup_token: null, setup_token_expires_at: null };
  if (name && typeof name === 'string' && name.trim()) profileUpdate.display_name = name.trim();
  if (phone && typeof phone === 'string' && phone.trim()) profileUpdate.phone = phone.trim();

  await supabase.from('profiles').update(profileUpdate).eq('id', profile.id);

  return NextResponse.json({ ok: true });
}
