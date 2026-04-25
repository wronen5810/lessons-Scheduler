import type { Metadata } from 'next';
import './globals.css';
import PushRegistrar from '@/components/PushRegistrar';
import { LanguageProvider } from '@/contexts/LanguageContext';

export const metadata: Metadata = {
  title: 'saderOT',
  description: 'סדר אותי — Book and manage private lessons',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <PushRegistrar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
