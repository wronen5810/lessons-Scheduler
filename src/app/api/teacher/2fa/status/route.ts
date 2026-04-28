import { NextResponse } from 'next/server';
import { requireTeacherSession } from '@/lib/auth';

// GET /api/teacher/2fa/status
// Returns 2FA enrollment state. No MFA cookie required — used by login page
// immediately after password auth to decide whether to show the TOTP step.
export async function GET() {
  const auth = await requireTeacherSession();
  if (auth.error) return auth.error;

  return NextResponse.json({ totp_enabled: auth.totp_enabled });
}
