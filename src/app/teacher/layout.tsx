import { createAuthSupabase, createServiceSupabase } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const auth = await createAuthSupabase();
  const { data: { user } } = await auth.getUser();

  if (!user) redirect('/login');

  const supabase = createServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: activeSub, error: subError } = await supabase
    .from('teacher_subscriptions')
    .select('id')
    .eq('teacher_id', user.id)
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .limit(1)
    .maybeSingle();

  console.log('[subscription gate] user:', user.id, 'today:', today, 'activeSub:', activeSub, 'error:', subError?.message);

  if (!activeSub) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">No valid subscription</h1>
          <p className="text-sm text-gray-500">
            Your account does not have an active subscription. Please contact the administrator to activate your account.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
