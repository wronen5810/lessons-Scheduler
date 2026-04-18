import { NextRequest, NextResponse } from 'next/server';
import { createAuthSupabase, createServiceSupabase } from '@/lib/supabase-server';
import { whatsappAdminNewTeacherRequest } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  const { name, email, phone, comments, policies_accepted_at, plan_id, starts_after } = await request.json();

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  // Attach teacher_id if request comes from a logged-in teacher
  let teacher_id: string | null = null;
  try {
    const auth = await createAuthSupabase();
    const { data: { user } } = await auth.auth.getUser();
    if (user) teacher_id = user.id;
  } catch { /* unauthenticated — fine */ }

  const supabase = createServiceSupabase();
  const { error } = await supabase.from('teacher_subscription_requests').insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || null,
    comments: comments?.trim() || null,
    policies_accepted_at: policies_accepted_at || null,
    plan_id: plan_id || null,
    starts_after: starts_after || null,
    teacher_id: teacher_id || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  whatsappAdminNewTeacherRequest({ name, email, phone, comments }).catch((e) =>
    console.error('Admin WhatsApp failed:', e)
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
