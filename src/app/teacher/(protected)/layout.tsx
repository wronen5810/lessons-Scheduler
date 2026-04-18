import { createAuthSupabase, createServiceSupabase } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SessionGuard from '@/components/SessionGuard';
import NoSubscriptionMessage from '@/components/NoSubscriptionMessage';

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
    return <NoSubscriptionMessage />;
  }

  return <SessionGuard loginPath="/teacher/login">{children}</SessionGuard>;
}
