'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const next = '/teacher';
    const supabase = createBrowserSupabase();

    async function handle() {
      // Case 1: PKCE flow — Supabase passes ?code=xxx
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) { router.replace(next); return; }
      }

      // Case 2: Implicit flow — Supabase passes #access_token=xxx&refresh_token=yyy in the hash
      const hash = window.location.hash.slice(1); // strip the leading #
      if (hash) {
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) { router.replace(next); return; }
        }
      }

      // Case 3: Session already exists (e.g. revisiting the page)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.replace(next); return; }

      // Nothing worked
      router.replace('/teacher/login?error=auth');
    }

    handle();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-sm text-gray-500">Logging you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
