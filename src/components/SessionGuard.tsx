'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const SESSION_KEY = 'ls_site_session';

/** Mark the session as active (call after successful login). */
export function markSessionActive() {
  sessionStorage.setItem(SESSION_KEY, '1');
}

/**
 * Wraps protected pages. On mount, checks whether the user arrived
 * from within this site (sessionStorage flag set). If not — they
 * navigated here from another domain — signs them out and redirects
 * to the login page.
 */
export default function SessionGuard({
  children,
  loginPath,
}: {
  children: React.ReactNode;
  loginPath: string;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const active = sessionStorage.getItem(SESSION_KEY);
    if (!active) {
      // Came from outside this site — sign out and force login
      createBrowserSupabase()
        .auth.signOut()
        .finally(() => router.replace(loginPath));
    } else {
      setReady(true);
    }
  }, [loginPath, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
