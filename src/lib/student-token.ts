import { createHmac, timingSafeEqual } from 'crypto';

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StudentClaims {
  email: string;
  teacherId: string;
  exp: number;
}

function secret(): string {
  const s = process.env.STUDENT_TOKEN_SECRET;
  if (!s) throw new Error('STUDENT_TOKEN_SECRET env var is not set');
  return s;
}

export function issueStudentToken(email: string, teacherId: string): string {
  const payload: StudentClaims = {
    email: email.toLowerCase().trim(),
    teacherId,
    exp: Date.now() + TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyStudentToken(token: string): StudentClaims | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 1) return null;
    const data = token.slice(0, dot);
    const sigBuf = Buffer.from(token.slice(dot + 1));
    const expectedBuf = Buffer.from(
      createHmac('sha256', secret()).update(data).digest('base64url'),
    );
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;
    const claims = JSON.parse(Buffer.from(data, 'base64url').toString()) as StudentClaims;
    if (Date.now() > claims.exp) return null;
    return claims;
  } catch {
    return null;
  }
}

export function claimsFromRequest(req: Request): StudentClaims | null {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyStudentToken(auth.slice(7));
}
