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

export default function StudentSettingsModal({ teacherId, email, token, onClose, onEmailChange }: Props) {
  const { t, isRTL } = useLanguage();

  const [newEmail, setNewEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<'ok' | 'err' | null>(null);
  const [togglingMfa, setTogglingMfa] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/student/settings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const d = await res.json();
        setNewEmail(d.email ?? email);
        setPhone(d.phone ?? '');
        setTwoFactorEnabled(d.two_factor_enabled ?? false);
      }
      setLoading(false);
    }
    load();
  }, [email, token]);

  async function handleSaveContact() {
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch('/api/student/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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

  async function handleToggle2FA() {
    setTogglingMfa(true);
    setSaveMsg(null);
    const next = !twoFactorEnabled;
    const res = await fetch('/api/student/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ two_factor_enabled: next }),
    });
    setTogglingMfa(false);
    if (res.ok) {
      setTwoFactorEnabled(next);
    } else {
      setSaveMsg('err');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
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

              {saveMsg === 'ok' && (
                <p className="mt-2 text-sm text-green-600">{t('student.saved')}</p>
              )}
              {saveMsg === 'err' && (
                <p className="mt-2 text-sm text-red-600">{t('student.saveError')}</p>
              )}

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
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
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
                <button
                  onClick={handleToggle2FA}
                  disabled={togglingMfa}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    twoFactorEnabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {twoFactorEnabled ? t('student.twoFactorToggleOff') : t('student.twoFactorToggleOn')}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
