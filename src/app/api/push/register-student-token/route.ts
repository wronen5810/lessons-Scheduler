import { NextRequest, NextResponse } from 'next/server';
import { claimsFromRequest } from '@/lib/student-token';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/push/register-student-token
// Auth: student JWT (Bearer token)
// Stores FCM push token keyed by student email + teacher_id
export async function POST(request: NextRequest) {
  const claims = claimsFromRequest(request);
  if (!claims) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token, platform } = await request.json();
  if (!token || !platform) {
    return NextResponse.json({ error: 'Missing token or platform' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        student_email: claims.email.toLowerCase(),
        student_teacher_id: claims.teacherId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
