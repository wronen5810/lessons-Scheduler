'use client';

import { Suspense } from 'react';
import RequestForm from '@/components/RequestForm';

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <RequestForm />
    </Suspense>
  );
}
