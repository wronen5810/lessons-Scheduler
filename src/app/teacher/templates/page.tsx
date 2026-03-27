'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SlotTemplate } from '@/lib/types';
import TemplateManager from '@/components/TemplateManager';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) {
        const body = await res.text();
        setError(`Error ${res.status}: ${body || 'Failed to load templates'}`);
        return;
      }
      const data = await res.json();
      setTemplates(data);
    } catch (e) {
      setError('Network error — is the server running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <Link href="/teacher" className="text-sm text-blue-600 hover:underline">
          &larr; Back to schedule
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Manage Weekly Slots</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {loading && <div className="text-center text-gray-400">Loading...</div>}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && (
          <TemplateManager templates={templates} onUpdate={load} />
        )}
      </main>
    </div>
  );
}
