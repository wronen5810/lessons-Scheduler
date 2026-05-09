import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  return NextResponse.json({ enabled: auth.totp_enabled });
}
