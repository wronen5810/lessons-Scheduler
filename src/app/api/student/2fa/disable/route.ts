import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { claimsFromRequest } from '@/lib/student-token';

// POST /api/student/2fa/disable
// Clears the TOTP secret and disables 2FA for the student.
export async function POST(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceSupabase();

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('teacher_id', claims.teacherId)
    .ilike('email', claims.email)
    .single();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  await supabase
    .from('students')
    .update({ two_factor_enabled: false, totp_secret: null })
    .eq('id', student.id);

  return NextResponse.json({ ok: true });
}
