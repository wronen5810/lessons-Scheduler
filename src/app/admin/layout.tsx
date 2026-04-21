'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import SessionGuard from '@/components/SessionGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  async function handleSignOut() {
    await createBrowserSupabase().auth.signOut();
    router.push('/admin/login');
  }

  if (isLoginPage) return <>{children}</>;

  return (
    <SessionGuard loginPath="/admin/login">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">Admin</span>
            <Link href="/admin/teachers" className="text-sm text-blue-600 hover:underline">Teachers</Link>
            <Link href="/admin/requests" className="text-sm text-blue-600 hover:underline">Requests</Link>
            <Link href="/admin/plans" className="text-sm text-blue-600 hover:underline">Plans</Link>
          </div>
          <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </div>
    </SessionGuard>
  );
}
