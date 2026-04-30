import { NextResponse } from 'next/server';
import { requireTeacherSession } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/teacher/record-login — called right after successful teacher sign-in
export async function POST() {
  const auth = await requireTeacherSession();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  await supabase.from('teacher_logins').insert({ teacher_id: auth.user.id });

  return NextResponse.json({ ok: true });
}
