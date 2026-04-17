import type { Metadata } from 'next';
import './globals.css';
import PushRegistrar from '@/components/PushRegistrar';

export const metadata: Metadata = {
  title: 'Lessons Scheduler',
  description: 'Book and manage private lessons',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><PushRegistrar />{children}</body>
    </html>
  );
}
