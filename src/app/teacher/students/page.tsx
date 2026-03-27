'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/teacher/students');
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setAdding(true);
    const res = await fetch('/api/teacher/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error);
    } else {
      setName('');
      setEmail('');
      load();
    }
    setAdding(false);
  }

  async function toggleActive(student: Student) {
    await fetch(`/api/teacher/students/${student.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !student.is_active }),
    });
    load();
  }

  async function handleDelete(student: Student) {
    if (!confirm(`Remove ${student.name} from the student list?`)) return;
    await fetch(`/api/teacher/students/${student.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Students</h1>
        <Link href="/teacher" className="text-sm text-blue-600 hover:underline">
          Back to schedule
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Add student form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Student</h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Full name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {adding ? 'Adding...' : 'Add student'}
            </button>
          </form>
          {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
        </div>

        {/* Student list */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
          ) : students.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No students yet.</div>
          ) : (
            students.map((student) => (
              <div key={student.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleActive(student)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                      student.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {student.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDelete(student)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}
