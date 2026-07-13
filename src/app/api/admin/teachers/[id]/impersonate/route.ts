import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/admin/teachers/[id]/impersonate
// Generates a one-time magic link for the teacher and returns the Supabase
// action_link. Opening it causes Supabase to verify the OTP and redirect to
// /auth/callback with tokens in the hash, which Case 2 of that page handles.
// Note: admin.generateLink does NOT email the user — we use the link directly.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://saderot.com';

  // 1. Get teacher's email
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(id);
  if (userError || !user?.email) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  // 2. Generate a magic link pointing to /auth/callback.
  //    Supabase will verify the OTP and redirect the browser to
  //    /auth/callback#access_token=...&refresh_token=... (implicit flow).
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
    options: {
      redirectTo: `${base}/auth/callback`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: linkError?.message ?? 'Failed to generate link' },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: linkData.properties.action_link });
}
