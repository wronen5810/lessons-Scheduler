import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { claimsFromRequest, issueStudentToken } from '@/lib/student-token';

// PATCH /api/student/settings
// Body: { email?, phone?, two_factor_enabled? }
// Requires valid student JWT. Updates the student record for the teacherId in the token.
export async function PATCH(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { email: newEmail, phone, two_factor_enabled } = body as {
    email?: string;
    phone?: string;
    two_factor_enabled?: boolean;
  };

  const supabase = createServiceSupabase();

  // Fetch current record to verify it exists
  const { data: student, error: fetchErr } = await supabase
    .from('students')
    .select('id, email, phone, two_factor_enabled')
    .eq('teacher_id', claims.teacherId)
    .ilike('email', claims.email)
    .single();

  if (fetchErr || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (newEmail !== undefined) updates.email = newEmail.toLowerCase().trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (two_factor_enabled !== undefined) updates.two_factor_enabled = two_factor_enabled;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error: updateErr } = await supabase
    .from('students')
    .update(updates)
    .eq('id', student.id);

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  // If email changed, issue a new token for the new email so the client stays authenticated
  const responseEmail = (newEmail ? newEmail.toLowerCase().trim() : claims.email);
  const newToken = issueStudentToken(responseEmail, claims.teacherId);

  return NextResponse.json({ ok: true, token: newToken, email: responseEmail });
}

// GET /api/student/settings — fetch current student info
export async function GET(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceSupabase();

  const { data: student, error } = await supabase
    .from('students')
    .select('email, phone, two_factor_enabled')
    .eq('teacher_id', claims.teacherId)
    .ilike('email', claims.email)
    .single();

  if (error || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  return NextResponse.json(student);
}
