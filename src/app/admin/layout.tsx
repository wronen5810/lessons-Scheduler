'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import SessionGuard from '@/components/SessionGuard';

const NAV_ITEMS = [
  { href: '/admin/teachers', label: 'Teachers' },
  { href: '/admin/requests', label: 'Requests' },
  { href: '/admin/plans', label: 'Plans' },
  { href: '/admin/logins', label: 'Logins' },
  { href: '/admin/leads', label: 'Leads' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await createBrowserSupabase().auth.signOut();
    router.push('/admin/login');
  }

  if (isLoginPage) return <>{children}</>;

  const currentLabel = NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label
    ?? (pathname.startsWith('/admin/2fa') ? '2FA Setup' : 'Admin');

  return (
    <SessionGuard loginPath="/admin/login">
      <div className="min-h-screen bg-gray-50" dir="ltr">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900">Admin</span>
            {currentLabel !== 'Admin' && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-sm text-gray-600">{currentLabel}</span>
              </>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                {NAV_ITEMS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      pathname.startsWith(href)
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                <div className="border-t border-gray-100 my-1" />
                <Link
                  href="/admin/2fa"
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-2 text-sm transition-colors ${
                    pathname.startsWith('/admin/2fa')
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🔐 2FA Setup
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </div>
    </SessionGuard>
  );
}
