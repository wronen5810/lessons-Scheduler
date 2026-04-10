import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/student/accept-privacy
export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from('students')
    .update({ privacy_accepted_at: new Date().toISOString() })
    .ilike('email', normalizedEmail);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
