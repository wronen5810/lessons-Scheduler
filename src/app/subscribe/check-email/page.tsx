'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SaderotLogo from '@/components/SaderotLogo';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full space-y-5 text-center">
        <div className="flex justify-center">
          <SaderotLogo size="md" lang="he" />
        </div>
        <div className="text-5xl">📬</div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">בדקו את תיבת המייל שלכם</h1>
          {email && (
            <p className="text-sm text-gray-500 mt-2">
              שלחנו לינק אימות לכתובת <span className="font-medium text-gray-700">{email}</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            לחצו על הלינק שבמייל כדי להשלים את ההרשמה.
          </p>
        </div>
        <p className="text-xs text-gray-400">
          לא קיבלתם? בדקו בתיקיית הספאם, או{' '}
          <a href="/subscribe" className="text-blue-600 hover:underline">
            נסו שוב
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
