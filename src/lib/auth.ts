import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAuthSupabase, createServiceSupabase } from './supabase-server';
import { verifyMfaCookie, MFA_COOKIE } from './mfa';

type TeacherSessionResult =
  | { error: NextResponse; user: null; totp_enabled?: never }
  | { error: null; user: User; totp_enabled: boolean };

/** Checks Supabase session + profile activity only — no MFA cookie check.
 *  Used by the 2FA endpoints themselves (setup, enable, disable, verify, status). */
export async function requireTeacherSession(): Promise<TeacherSessionResult> {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  const service = createServiceSupabase();
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('is_active, totp_enabled')
    .eq('id', user.id)
    .single();

  // If the totp_enabled column doesn't exist yet, fall back without breaking auth
  if (profileError && profileError.code !== 'PGRST116') {
    const { data: basic } = await service
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single();
    if (!basic || !basic.is_active) {
      return { error: NextResponse.json({ error: 'Account is inactive' }, { status: 403 }), user: null };
    }
    return { error: null, user, totp_enabled: false };
  }

  if (!profile || !profile.is_active) {
    return { error: NextResponse.json({ error: 'Account is inactive' }, { status: 403 }), user: null };
  }

  return { error: null, user, totp_enabled: profile.totp_enabled ?? false };
}

/** Full teacher auth: session + profile + MFA cookie when 2FA is enabled. */
export async function requireTeacher(): Promise<{ error: NextResponse; user: null } | { error: null; user: User }> {
  const auth = await requireTeacherSession();
  if (auth.error) return { error: auth.error, user: null };

  if (auth.totp_enabled) {
    const cookieStore = await cookies();
    const mfaValue = cookieStore.get(MFA_COOKIE)?.value;
    if (!verifyMfaCookie(mfaValue, auth.user.id)) {
      return { error: NextResponse.json({ error: 'MFA verification required' }, { status: 401 }), user: null };
    }
  }

  return { error: null, user: auth.user };
}

/** Call at the top of admin-only API route handlers. */
export async function requireAdmin(): Promise<{ error: NextResponse; user: null } | { error: null; user: User }> {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  const service = createServiceSupabase();
  const { data: profile } = await service.from('profiles').select('role, is_active').eq('id', user.id).single();

  if (!profile || profile.role !== 'admin' || !profile.is_active) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null };
  }

  return { error: null, user };
}
