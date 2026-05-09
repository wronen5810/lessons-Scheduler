'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useLanguage } from '@/contexts/LanguageContext';

export default function EmailVerificationBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.email_confirmed_at) {
        setShow(true);
        setEmail(user.email ?? '');
      }
    });
  }, []);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.resend({ type: 'signup', email }).catch(() => {});
    setResent(true);
    setResending(false);
  }

  if (!show) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
      <span className="text-amber-800">
        {resent ? t('signup.verifyResent') : t('signup.verifyBanner')}
      </span>
      <div className="flex items-center gap-3 flex-shrink-0">
        {!resent && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-amber-700 font-medium hover:text-amber-900 disabled:opacity-50 underline underline-offset-2"
          >
            {resending ? '…' : t('signup.resendVerification')}
          </button>
        )}
        <button
          onClick={() => setShow(false)}
          className="text-amber-500 hover:text-amber-700 leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
