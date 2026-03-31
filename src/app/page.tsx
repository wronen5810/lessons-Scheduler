'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Teacher {
  id: string;
  display_name: string;
}

export default function StudentEntryPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);

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

    if (data.teachers.length === 1) {
      router.push(`/t/${data.teachers[0].id}?email=${encodeURIComponent(email)}`);
    } else {
      setTeachers(data.teachers);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Book a Lesson</h1>

        {!teachers ? (
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
        ) : (
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
              onClick={() => { setTeachers(null); setEmail(''); }}
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
