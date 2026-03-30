import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createAuthSupabase, createServiceSupabase } from './supabase-server';

/** Call at the top of teacher-only API route handlers. Returns the authenticated user or a 401/403 response. */
export async function requireTeacher(): Promise<{ error: NextResponse; user: null } | { error: null; user: User }> {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  const service = createServiceSupabase();
  const { data: profile } = await service.from('profiles').select('role, is_active').eq('id', user.id).single();

  if (!profile || !profile.is_active) {
    return { error: NextResponse.json({ error: 'Account is inactive' }, { status: 403 }), user: null };
  }

  return { error: null, user };
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
