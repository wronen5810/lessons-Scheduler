import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/check-teacher?email=... — public, returns whether email is a registered teacher
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.toLowerCase().trim();
  if (!email) return NextResponse.json({ exists: false });

  const supabase = createServiceSupabase();
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
  const exists = users.some((u) => u.email?.toLowerCase() === email);
  return NextResponse.json({ exists });
}
