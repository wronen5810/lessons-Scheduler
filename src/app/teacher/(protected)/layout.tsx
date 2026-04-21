import { createAuthSupabase, createServiceSupabase } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SessionGuard from '@/components/SessionGuard';
import NoSubscriptionMessage from '@/components/NoSubscriptionMessage';
import TeacherNav from '@/components/TeacherNav';

export const dynamic = 'force-dynamic';

export default async function TeacherProtectedLayout({ children }: { children: React.ReactNode }) {
  const auth = await createAuthSupabase();
  const { data: { user } } = await auth.auth.getUser();

  if (!user) redirect('/teacher/login');

  const supabase = createServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: activeSub } = await supabase
    .from('teacher_subscriptions')
    .select('id')
    .eq('teacher_id', user.id)
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .limit(1)
    .maybeSingle();

  if (!activeSub) {
    const [{ data: lastSub }, { data: profile }, { data: { user: authUser } }] = await Promise.all([
      supabase
        .from('teacher_subscriptions')
        .select('end_date')
        .eq('teacher_id', user.id)
        .lt('end_date', today)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('profiles').select('display_name, phone').eq('id', user.id).single(),
      supabase.auth.admin.getUserById(user.id),
    ]);

    return (
      <NoSubscriptionMessage
        expired={!!lastSub}
        endDate={lastSub?.end_date ?? undefined}
        name={profile?.display_name ?? ''}
        email={authUser?.email ?? ''}
        phone={(profile as { phone?: string } | null)?.phone ?? undefined}
      />
    );
  }

  return (
    <SessionGuard loginPath="/teacher/login">
      <div className="min-h-screen bg-slate-50">
        <TeacherNav />
        {children}
      </div>
    </SessionGuard>
  );
}
