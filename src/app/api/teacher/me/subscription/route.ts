import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teacher/me/subscription — returns current subscription status + teacher details
export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: activeSub } = await supabase
    .from('teacher_subscriptions')
    .select('id, end_date')
    .eq('teacher_id', auth.user.id)
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .limit(1)
    .maybeSingle();

  const { data: lastSub } = await supabase
    .from('teacher_subscriptions')
    .select('id, end_date')
    .eq('teacher_id', auth.user.id)
    .lt('end_date', today)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phone')
    .eq('id', auth.user.id)
    .single();

  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(auth.user.id);

  return NextResponse.json({
    status: activeSub ? 'active' : lastSub ? 'expired' : 'none',
    active_end_date: activeSub?.end_date ?? null,
    last_end_date: lastSub?.end_date ?? null,
    teacher: {
      id: auth.user.id,
      name: profile?.display_name ?? '',
      email: authUser?.email ?? '',
      phone: (profile as { phone?: string } | null)?.phone ?? '',
    },
  });
}
