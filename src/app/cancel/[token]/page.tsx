'use client';

import { use } from 'react';
import CancelForm from '@/components/CancelForm';

export default function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <CancelForm token={token} />;
}
