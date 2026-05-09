import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'sonner';

const GA_ID = 'G-Z7DNZEJ3QK';

export const metadata: Metadata = {
  title: 'סדר אותי — ניהול שיעורים פרטיים. סוף סוף בסדר.',
  description: 'האפליקציה שעוזרת למורים פרטיים בישראל לנהל שיעורים, תלמידים ותשלומים. שלושה חודשי ניסיון חינם.',
  openGraph: {
    title: 'סדר אותי — ניהול שיעורים פרטיים. סוף סוף בסדר.',
    description: 'האפליקציה שעוזרת למורים פרטיים בישראל לנהל שיעורים, תלמידים ותשלומים. שלושה חודשי ניסיון חינם.',
    url: 'https://saderot.com',
    siteName: 'סדר אותי',
    images: [
      {
        url: 'https://saderot.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'סדר אותי - האפליקציה למורים פרטיים בישראל',
      },
    ],
    locale: 'he_IL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'סדר אותי — סוף סוף בסדר',
    description: 'ניהול שיעורים פרטיים. 3 חודשים חינם.',
    images: ['https://saderot.com/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <LanguageProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
