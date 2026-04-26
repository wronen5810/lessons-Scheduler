import type { Metadata } from 'next';
import './globals.css';
import PushRegistrar from '@/components/PushRegistrar';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'SaderOT — Lessons Scheduler',
  description: 'The scheduling tool built for private teachers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <PushRegistrar />
          {children}
          <Toaster position="top-center" richColors closeButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
