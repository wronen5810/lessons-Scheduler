import { createHmac } from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';

const MFA_SECRET = process.env.MFA_SECRET ?? 'dev-mfa-secret-change-in-production';

export const MFA_COOKIE = 'mfa_v';
export const MFA_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function signMfaCookie(userId: string): string {
  const sig = createHmac('sha256', MFA_SECRET).update(userId).digest('hex');
  return `${userId}.${sig}`;
}

export function verifyMfaCookie(value: string | undefined, userId: string): boolean {
  if (!value) return false;
  return value === signMfaCookie(userId);
}

export function generateTotpSecret(): string {
  return generateSecret();
}

export function getTotpUri(email: string, secret: string): string {
  return generateURI({ label: email, issuer: 'Saderot', secret });
}

export function verifyTotp(code: string, secret: string): boolean {
  try {
    const result = verifySync({ secret, token: code });
    return typeof result === 'object' ? result.valid : Boolean(result);
  } catch {
    return false;
  }
}
