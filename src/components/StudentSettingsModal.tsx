'use client';

import { useEffect, useState } from 'react';
import { Settings, X, Shield, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  teacherId: string;
  email: string;
  token: string | null;
  onClose: () => void;
  onEmailChange: (newEmail: string, newToken: string) => void;
}

type TwoFAStep = 'idle' | 'scanning' | 'confirming';

export default function StudentSettingsModal({ teacherId, email, token, onClose, onEmailChange }: Props) {
  const { t, isRTL } = useLanguage();

  const [newEmail, setNewEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<'ok' | 'err' | null>(null);

  // 2FA setup flow
  const [mfaStep, setMfaStep] = useState<TwoFAStep>('idle');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch('/api/student/settings', { headers: authHeaders });
      if (res.ok) {
        const d = await res.json();
        setNewEmail(d.email ?? email);
        setPhone(d.phone ?? '');
        setTwoFactorEnabled(d.two_factor_enabled ?? false);
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveContact() {
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch('/api/student/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ email: newEmail, phone }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setSaveMsg('ok');
      if (d.token && d.email) onEmailChange(d.email, d.token);
      setTimeout(() => setSaveMsg(null), 3000);
    } else {
      setSaveMsg('err');
    }
  }

  async function handleStartSetup() {
    setMfaLoading(true);
    setMfaError('');
    const res = await fetch('/api/student/2fa/setup', {
      method: 'POST',
      headers: authHeaders,
    });
    setMfaLoading(false);
    if (!res.ok) { setMfaError(t('student.saveError')); return; }
    const d = await res.json();
    setQrDataUrl(d.qr);
    setTotpSecret(d.secret);
    setTotpCode('');
    setMfaStep('scanning');
  }

  async function handleConfirmEnable() {
    if (totpCode.length < 6) return;
    setMfaLoading(true);
    setMfaError('');
    const res = await fetch('/api/student/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ code: totpCode }),
    });
    setMfaLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setMfaError(d.error ?? t('join.invalidCode'));
      return;
    }
    setTwoFactorEnabled(true);
    setMfaStep('idle');
    setQrDataUrl('');
    setTotpSecret('');
    setTotpCode('');
  }

  async function handleDisable() {
    setMfaLoading(true);
    setMfaError('');
    const res = await fetch('/api/student/2fa/disable', {
      method: 'POST',
      headers: authHeaders,
    });
    setMfaLoading(false);
    if (res.ok) {
      setTwoFactorEnabled(false);
      setMfaStep('idle');
    } else {
      setMfaError(t('student.saveError'));
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-bold text-gray-900">{t('student.settingsTitle')}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">{t('common.loading')}</div>
        ) : (
          <div className="p-5 space-y-6">

            {/* Contact info */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('student.contactInfo')}</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.phone')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-1234567"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {saveMsg === 'ok' && <p className="mt-2 text-sm text-green-600">{t('student.saved')}</p>}
              {saveMsg === 'err' && <p className="mt-2 text-sm text-red-600">{t('student.saveError')}</p>}
              <button
                onClick={handleSaveContact}
                disabled={saving}
                className="mt-3 w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>

            {/* 2FA section */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('student.twoFactor')}</p>

              {/* Status bar */}
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 mb-4">
                <div className="mt-0.5">
                  {twoFactorEnabled
                    ? <ShieldCheck className="w-5 h-5 text-green-600" />
                    : <Shield className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {twoFactorEnabled ? t('student.twoFactorEnabled') : t('student.twoFactorDisabled')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('student.twoFactorDesc')}</p>
                </div>
              </div>

              {mfaError && <p className="text-sm text-red-600 mb-3">{mfaError}</p>}

              {/* ── idle: show enable / disable button ── */}
              {mfaStep === 'idle' && (
                twoFactorEnabled ? (
                  <button
                    onClick={handleDisable}
                    disabled={mfaLoading}
                    className="w-full text-sm font-medium py-2.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                  >
                    {mfaLoading ? t('common.saving') : t('student.twoFactorToggleOff')}
                  </button>
                ) : (
                  <button
                    onClick={handleStartSetup}
                    disabled={mfaLoading}
                    className="w-full text-sm font-medium py-2.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
                  >
                    {mfaLoading ? t('common.loading') : t('student.twoFactorToggleOn')}
                  </button>
                )
              )}

              {/* ── scanning: show QR code ── */}
              {mfaStep === 'scanning' && qrDataUrl && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{t('student.scanQr')}</p>
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR code" className="w-48 h-48 rounded-lg border border-gray-200" />
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 mb-1">{t('student.manualCode')}</p>
                    <p className="text-xs font-mono break-all text-gray-800 select-all">{totpSecret}</p>
                  </div>
                  <button
                    onClick={() => setMfaStep('confirming')}
                    className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('student.nextStep')}
                  </button>
                  <button
                    onClick={() => { setMfaStep('idle'); setMfaError(''); }}
                    className="w-full text-sm text-gray-400 hover:text-gray-600"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}

              {/* ── confirming: enter TOTP code to activate ── */}
              {mfaStep === 'confirming' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{t('student.enterCodeToConfirm')}</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    autoFocus
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleConfirmEnable}
                    disabled={mfaLoading || totpCode.length < 6}
                    className="w-full bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {mfaLoading ? t('common.saving') : t('student.activate2fa')}
                  </button>
                  <button
                    onClick={() => { setMfaStep('scanning'); setTotpCode(''); setMfaError(''); }}
                    className="w-full text-sm text-gray-400 hover:text-gray-600"
                  >
                    {t('common.back')}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
