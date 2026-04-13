import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { whatsappAdminNewTeacherRequest } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  const { name, email, phone, comments } = await request.json();

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { error } = await supabase.from('teacher_subscription_requests').insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || null,
    comments: comments?.trim() || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  whatsappAdminNewTeacherRequest({ name, email, phone, comments }).catch((e) =>
    console.error('Admin WhatsApp failed:', e)
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
