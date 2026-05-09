'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type Phase = 'idle' | 'setup' | 'disable';

export default function AdminTwoFactorPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/admin/2fa/status')
      .then(r => r.json())
      .then(d => setEnabled(d.enabled ?? false));
  }, []);

  async function startSetup() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/2fa/setup', { method: 'POST' });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Setup failed'); return; }
    setQr(data.qr);
    setSecret(data.secret);
    setPhase('setup');
  }

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Invalid code'); return; }
    setEnabled(true);
    setPhase('idle');
    setCode('');
    setQr('');
    setSecret('');
    setSuccess('2FA enabled. You will be asked for a code on every login.');
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Invalid code'); return; }
    setEnabled(false);
    setPhase('idle');
    setCode('');
    setSuccess('2FA disabled.');
  }

  function cancel() {
    setPhase('idle');
    setCode('');
    setError('');
    setQr('');
    setSecret('');
  }

  if (enabled === null) {
    return <div className="flex justify-center py-16"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Two-Factor Authentication</h1>
      <p className="text-sm text-gray-500 mb-6">
        {enabled
          ? 'A verification code is required on every admin login.'
          : 'Add an extra layer of security to your admin account.'}
      </p>

      {success && (
        <div className="mb-6 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <span>✓</span> {success}
        </div>
      )}

      {/* Current status badge */}
      <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl mb-6">
        <span className={`w-2.5 h-2.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className="text-sm font-medium text-gray-700">
          {enabled ? '2FA is enabled' : '2FA is disabled'}
        </span>
      </div>

      {/* ── Setup phase ── */}
      {phase === 'setup' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">1. Scan this QR code with your authenticator app</p>
            <div className="flex justify-center">
              <Image src={qr} alt="TOTP QR code" width={180} height={180} unoptimized />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Or enter this key manually</p>
            <code className="block text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 break-all select-all font-mono text-gray-700">
              {secret}
            </code>
          </div>
          <form onSubmit={handleEnable} className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">2. Enter the 6-digit code to confirm</p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enabling...' : 'Enable 2FA'}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Disable phase ── */}
      {phase === 'disable' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-sm text-gray-600">Enter the current 6-digit code from your authenticator app to disable 2FA.</p>
          <form onSubmit={handleDisable} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Idle phase actions ── */}
      {phase === 'idle' && (
        enabled ? (
          <button
            onClick={() => { setPhase('disable'); setSuccess(''); setError(''); }}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Disable 2FA
          </button>
        ) : (
          <button
            onClick={() => { startSetup(); setSuccess(''); }}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generating...' : 'Set up 2FA'}
          </button>
        )
      )}
    </div>
  );
}
