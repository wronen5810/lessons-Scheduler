'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const SESSION_KEY = 'ls_site_session';

/** Mark the session as active (call after successful login).
 *  Pass persistent=true for native app contexts (teacher/student) — uses localStorage.
 *  Default (false) uses sessionStorage for web-only flows like admin. */
export function markSessionActive(persistent = false) {
  (persistent ? localStorage : sessionStorage).setItem(SESSION_KEY, '1');
}

/**
 * Wraps protected pages. On mount, checks whether the user arrived
 * from within this site (storage flag set). If not — signs them out
 * and redirects to the login page.
 *
 * persistent=true  → localStorage  (survives app restart — for Capacitor/mobile)
 * persistent=false → sessionStorage (cleared on tab/window close — for admin)
 */
export default function SessionGuard({
  children,
  loginPath,
  persistent = false,
}: {
  children: React.ReactNode;
  loginPath: string;
  persistent?: boolean;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storage = persistent ? localStorage : sessionStorage;
    const active = storage.getItem(SESSION_KEY);
    if (!active) {
      createBrowserSupabase()
        .auth.signOut()
        .finally(() => router.replace(loginPath));
    } else {
      setReady(true);
    }
  }, [loginPath, persistent, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
