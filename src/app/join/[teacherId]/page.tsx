'use client';

import { use, Suspense } from 'react';
import JoinForm from '@/components/JoinForm';

export default function JoinPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    }>
      <JoinForm teacherId={teacherId} />
    </Suspense>
  );
}
