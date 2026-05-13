import type { Metadata } from 'next';
import { Suspense } from 'react';
import TrialFormPage from './TrialFormPage';

export const metadata: Metadata = {
  title: 'סדר אותי — 3 חודשים חינם',
  description: '3 חודשים חינם לניהול שיעורים פרטיים — ללא כרטיס אשראי, ביטול בכל עת',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'סדר אותי — 3 חודשים חינם',
    description: '3 חודשים חינם לניהול שיעורים פרטיים — ללא כרטיס אשראי, ביטול בכל עת',
    locale: 'he_IL',
    type: 'website',
  },
};

export default function TrialPage() {
  return (
    <Suspense>
      <TrialFormPage />
    </Suspense>
  );
}
