'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import SaderotLogo from '@/components/SaderotLogo';

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

  function storeTokens(tokens: Record<string, string>) {
    for (const [tid, tok] of Object.entries(tokens)) {
      localStorage.setItem(`st_${tid}`, tok);
    }
  }

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

    if (data.tokens) storeTokens(data.tokens);

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
    const res = await fetch('/api/student/accept-privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, teacherIds: pendingTeachers.map(t => t.id) }),
    });
    const data = res.ok ? await res.json() : {};
    if (data.tokens) storeTokens(data.tokens);
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
        {/* Brand header */}
        <div className="flex items-center justify-between mb-6">
          <SaderotLogo size="sm" />
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← Back</Link>
        </div>

        {/* Student icon — only on the entry step */}
        {step === 'email' && (
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-purple-600" strokeWidth={1.5} />
            </div>
          </div>
        )}

        <h1 className="text-xl font-semibold text-gray-900 mb-2">Student Login</h1>

        {step === 'email' && (
          <>
            <p className="text-sm text-gray-500 mb-6">Enter your email to see your available lesson times.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
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
            <p className="text-sm text-gray-500 mb-4">Before you continue, please agree to our privacy policy.</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm text-gray-600">
              <p>We use your email, name, and lesson info solely to enable scheduling with your teacher. Your data is stored securely and never sold or shared.</p>
              <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline mt-2 inline-block">
                Read the full Privacy Policy →
              </Link>
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
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
