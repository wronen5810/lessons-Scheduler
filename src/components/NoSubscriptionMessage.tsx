'use client';

import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  expired: boolean;
  endDate?: string;
  name: string;
  email: string;
  phone?: string;
}

export default function NoSubscriptionMessage({ expired, endDate, name, email, phone }: Props) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await createBrowserSupabase().auth.signOut();
    router.replace('/teacher/login');
  }

  const renewParams = new URLSearchParams({ type: 'renewal' });
  if (name) renewParams.set('name', name);
  if (email) renewParams.set('email', email);
  if (phone) renewParams.set('phone', phone);
  const renewUrl = `/subscribe?${renewParams.toString()}`;

  const formattedDate = endDate
    ? new Date(endDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {expired ? (
          <>
            <h1 className="text-lg font-semibold text-gray-900">Subscription Expired</h1>
            <p className="text-sm text-gray-500">
              Your subscription expired on <span className="font-medium text-gray-700">{formattedDate}</span>.
              Submit a renewal request to continue using the platform.
            </p>
            <Link
              href={renewUrl}
              className="block w-full bg-blue-600 text-white text-sm font-medium rounded-xl py-2.5 hover:bg-blue-700 transition-colors"
            >
              Renew Subscription
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-gray-900">No Active Subscription</h1>
            <p className="text-sm text-gray-500">
              You don&apos;t have an active subscription. Please contact the administrator to get started.
            </p>
          </>
        )}

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {signingOut ? '...' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
