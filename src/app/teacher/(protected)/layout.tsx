import { createAuthSupabase, createServiceSupabase } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { fromZonedTime } from 'date-fns-tz';
import SessionGuard from '@/components/SessionGuard';
import NoSubscriptionMessage from '@/components/NoSubscriptionMessage';
import TeacherNav from '@/components/TeacherNav';
import AssistantBar from '@/components/AssistantBar';
import PolicyGate from '@/components/PolicyGate';
import PolicyFooter from '@/components/PolicyFooter';
import PushRegistrar from '@/components/PushRegistrar';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { todayInIsrael, TZ } from '@/lib/dates';

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

  // Check policies + fetch upcoming lesson in parallel
  const todayStr = todayInIsrael();
  const nowMs = Date.now();

  const [{ data: tSettings }, { data: recurring }, { data: oneTime }] = await Promise.all([
    supabase.from('teacher_settings').select('features').eq('teacher_id', user.id).single(),
    supabase.from('recurring_bookings').select('lesson_date, start_time')
      .eq('teacher_id', user.id).in('status', ['pending', 'approved'])
      .gte('lesson_date', todayStr).order('lesson_date').order('start_time').limit(10),
    supabase.from('one_time_bookings').select('specific_date, start_time')
      .eq('teacher_id', user.id).in('status', ['pending', 'approved'])
      .gte('specific_date', todayStr).order('specific_date').order('start_time').limit(10),
  ]);

  const featuresData = (tSettings?.features ?? {}) as Record<string, unknown>;
  const policiesAccepted = !!featuresData.policies_accepted_at;

  if (!policiesAccepted) {
    return (
      <SessionGuard loginPath="/teacher/login" persistent>
        <PolicyGate />
      </SessionGuard>
    );
  }

  // Compute next upcoming lesson
  const candidates = [
    ...(recurring ?? []).map(r => ({ date: r.lesson_date as string, start_time: r.start_time as string })),
    ...(oneTime ?? []).map(o => ({ date: o.specific_date as string, start_time: o.start_time as string })),
  ].sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.start_time.localeCompare(b.start_time));

  let nextLesson: { hours: number; minutes: number } | null = null;
  for (const c of candidates) {
    const lessonUtc = fromZonedTime(`${c.date}T${c.start_time}`, TZ);
    if (lessonUtc.getTime() > nowMs) {
      const diffMs = lessonUtc.getTime() - nowMs;
      const totalMinutes = Math.floor(diffMs / 60000);
      nextLesson = { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
      break;
    }
  }

  return (
    <SessionGuard loginPath="/teacher/login" persistent>
      <PushRegistrar />
      <EmailVerificationBanner />
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <TeacherNav nextLesson={nextLesson} />
        <AssistantBar />
        <div className="flex-1">{children}</div>
        <PolicyFooter />
      </div>
    </SessionGuard>
  );
}
