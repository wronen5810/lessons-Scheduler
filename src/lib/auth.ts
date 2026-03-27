import { NextResponse } from 'next/server';
import { createAuthSupabase } from './supabase-server';

/** Call at the top of teacher-only API route handlers. Returns 401 response if not authenticated. */
export async function requireTeacher(): Promise<{ error: NextResponse } | { error: null }> {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { error: null };
}
