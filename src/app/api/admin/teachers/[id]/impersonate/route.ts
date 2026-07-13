import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/admin/teachers/[id]/impersonate
// Creates a session for the teacher and returns a URL that logs the admin
// in as that teacher via the existing /auth/callback implicit-flow handler.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();

  // Create a session directly — avoids the PKCE magic-link roundtrip which
  // fails because the new tab has no stored PKCE code verifier.
  const { data, error } = await supabase.auth.admin.createSession({ userId: id });

  if (error || !data?.session) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create session' }, { status: 500 });
  }

  const { access_token, refresh_token } = data.session;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';

  // Pass tokens in the hash so /auth/callback's implicit-flow branch sets
  // the session and redirects to /teacher.
  const url =
    `${base}/auth/callback` +
    `#access_token=${encodeURIComponent(access_token)}` +
    `&refresh_token=${encodeURIComponent(refresh_token)}` +
    `&token_type=bearer`;

  return NextResponse.json({ url });
}
