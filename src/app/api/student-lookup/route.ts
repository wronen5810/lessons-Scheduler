import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/student-lookup — find which teacher a student belongs to
export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('students')
    .select('teacher_id, is_active')
    .eq('email', email.toLowerCase().trim());

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'Email not found. Please contact your teacher.' }, { status: 404 });
  }

  const active = data.filter((s: { teacher_id: string; is_active: boolean }) => s.is_active);
  if (active.length === 0) {
    return NextResponse.json({ error: 'Your account is inactive. Please contact your teacher.' }, { status: 403 });
  }

  // Enrich with teacher display names
  const teacherIds = active.map((s: { teacher_id: string }) => s.teacher_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', teacherIds);

  const teachers = (profiles ?? []).map((p: { id: string; display_name: string }) => ({
    id: p.id,
    display_name: p.display_name,
  }));

  return NextResponse.json({ teachers });
}
