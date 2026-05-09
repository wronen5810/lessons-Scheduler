import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { emailSubscribeInvite } from '@/lib/email';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('leads')
    .select('id, email, source, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/leads — public endpoint: capture email lead and send invite
export async function POST(request: NextRequest) {
  const { email, source = 'landing' } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from('leads')
    .insert({ email: email.toLowerCase().trim(), source });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await emailSubscribeInvite({ email: email.trim() }).catch(() => {});

  return NextResponse.json({ success: true }, { status: 201 });
}
