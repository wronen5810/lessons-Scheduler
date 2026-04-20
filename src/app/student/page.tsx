'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Teacher {
  id: string;
  display_name: string;
}

type Step = 'email' | 'privacy' | 'teachers';

export default function StudentEntryPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/student-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.');
      return;
    }

    if (!data.privacy_accepted) {
      setPendingTeachers(data.teachers);
      setStep('privacy');
      return;
    }

    if (data.teachers.length === 1) {
      router.push(`/t/${data.teachers[0].id}?email=${encodeURIComponent(email)}`);
    } else {
      setTeachers(data.teachers);
      setStep('teachers');
    }
  }

  async function handlePrivacyAccept() {
    setLoading(true);
    await fetch('/api/student/accept-privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);

    if (pendingTeachers.length === 1) {
      router.push(`/t/${pendingTeachers[0].id}?email=${encodeURIComponent(email)}`);
    } else {
      setTeachers(pendingTeachers);
      setStep('teachers');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-6 block">← Back</Link>

        {/* Student illustration — only on the entry step */}
        {step === 'email' && (
          <div className="flex justify-center mb-5">
            <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="80" cy="58" r="28" fill="#fde68a"/>
              <path d="M52 58 Q52 28 80 28 Q108 28 108 58" stroke="#7c3aed" strokeWidth="6" fill="none" strokeLinecap="round"/>
              <rect x="44" y="52" width="14" height="20" rx="6" fill="#7c3aed"/>
              <rect x="102" y="52" width="14" height="20" rx="6" fill="#7c3aed"/>
              <circle cx="72" cy="55" r="3" fill="#92400e"/>
              <circle cx="88" cy="55" r="3" fill="#92400e"/>
              <path d="M70 68 Q80 76 90 68" stroke="#92400e" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <text x="112" y="40" fontSize="22" fill="#7c3aed" opacity="0.9">♪</text>
              <text x="28" y="35" fontSize="16" fill="#a78bfa" opacity="0.8">♩</text>
              <text x="118" y="65" fontSize="14" fill="#c4b5fd" opacity="0.7">♫</text>
              <text x="22" y="60" fontSize="18" fill="#7c3aed" opacity="0.6">♬</text>
              <rect x="60" y="88" width="40" height="30" rx="8" fill="#8b5cf6"/>
              <rect x="40" y="90" width="20" height="10" rx="5" fill="#8b5cf6"/>
              <rect x="100" y="90" width="20" height="10" rx="5" fill="#8b5cf6"/>
            </svg>
          </div>
        )}

        <h1 className="text-xl font-semibold text-gray-900 mb-2">Student Login</h1>

        {step === 'email' && (
          <>
            <p className="text-sm text-gray-500 mb-6">Enter your email to see available times.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Looking up...' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 'privacy' && (
          <>
            <p className="text-sm text-gray-500 mb-4">Before you continue, please read and agree to our privacy policy.</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm text-gray-600 max-h-48 overflow-y-auto space-y-2">
              <p>We collect your name, email, phone number, and lesson information to enable scheduling between you and your teacher.</p>
              <p>Your data is stored securely and is never sold or shared with third parties for marketing purposes.</p>
              <p>You may request deletion of your data at any time by contacting your teacher.</p>
              <p className="mt-2">
                <Link href="/privacy" target="_blank" className="text-blue-600 underline hover:text-blue-700">
                  Read the full Privacy Policy →
                </Link>
              </p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I have read and agree to the{' '}
                <Link href="/privacy" target="_blank" className="text-blue-600 underline hover:text-blue-700">
                  Privacy Policy
                </Link>
              </span>
            </label>
            <button
              onClick={handlePrivacyAccept}
              disabled={!privacyChecked || loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Continuing...' : 'Continue'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setPrivacyChecked(false); }}
              className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600"
            >
              ← Use a different email
            </button>
          </>
        )}

        {step === 'teachers' && (
          <>
            <p className="text-sm text-gray-500 mb-4">You are registered with multiple teachers. Choose one:</p>
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => router.push(`/t/${teacher.id}?email=${encodeURIComponent(email)}`)}
                  className="w-full text-left border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-blue-400 transition-colors"
                >
                  {teacher.display_name}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setStep('email'); setEmail(''); }}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600"
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
