'use client';

import { use, Suspense } from 'react';
import JoinForm from '@/components/JoinForm';

export default function JoinPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = use(params);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <Suspense fallback={<div className="text-center text-gray-400 text-sm">Loading...</div>}>
          <JoinForm teacherId={teacherId} />
        </Suspense>
      </div>
    </div>
  );
}
