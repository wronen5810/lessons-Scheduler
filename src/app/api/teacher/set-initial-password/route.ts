import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/teacher/set-initial-password — public, token-gated
// Body: { token: string, password: string }
export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

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

  if (lookupError || !profile) {
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

  // Invalidate the token
  await supabase
    .from('profiles')
    .update({ setup_token: null, setup_token_expires_at: null })
    .eq('id', profile.id);

  return NextResponse.json({ ok: true });
}
