import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lesson Scheduler',
  description: 'Book and manage private lessons',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>'use client';
import { useEffect } from 'react';
import { registerPushNotifications } from '@/lib/push-notifications';

export default function PushRegistrar() {
  useEffect(() => {
    registerPushNotifications();
  }, []);
  return null;
}{children}</body>
    </html>
  );
}
