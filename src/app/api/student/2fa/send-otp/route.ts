import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { createHash, randomInt } from 'crypto';
import { Resend } from 'resend';

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

// POST /api/student/2fa/send-otp
// Body: { email }
// Generates a 6-digit OTP, stores its hash, and emails it to the student.
export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email: string };
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createServiceSupabase();

  // Delete any existing OTP for this email before issuing a new one
  await supabase.from('student_otp_codes').delete().eq('email', normalizedEmail);

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const { error } = await supabase.from('student_otp_codes').insert({
    email: normalizedEmail,
    code_hash: hashCode(code),
    expires_at: expiresAt.toISOString(),
  });

  if (error) return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: normalizedEmail,
      subject: `Your login code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
          <h2>Your Login Code</h2>
          <p>Use the code below to complete your login. It expires in 10 minutes.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#f5f5f5;border-radius:8px;margin:16px 0">
            ${code}
          </div>
          <p style="font-size:13px;color:#888">If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
