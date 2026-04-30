import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { emailTeacherWelcome } from '@/lib/email';

const TEST_EMAIL = 'test@saderot.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? '';

// POST /api/admin/test-email — sends a test welcome email to test@saderot.com
export async function POST() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const placeholderLink = `${BASE_URL}/auth/callback?next=/teacher/set-password&test=1`;

  try {
    await emailTeacherWelcome({
      teacherName: 'Test Teacher',
      teacherEmail: TEST_EMAIL,
      setPasswordLink: placeholderLink,
    });
    return NextResponse.json({ ok: true, sent_to: TEST_EMAIL });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[test-email]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
