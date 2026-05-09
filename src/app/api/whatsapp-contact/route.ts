import { NextResponse } from 'next/server';

export function GET() {
  const phone = process.env.ADMIN_WHATSAPP_PHONE;
  if (!phone) return NextResponse.json({ error: 'not configured' }, { status: 503 });

  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
  const text = encodeURIComponent('אני רוצה לשמוע על סדר אותי');
  return NextResponse.redirect(`https://wa.me/${e164}?text=${text}`, 302);
}
