'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BillingRow } from '@/app/api/teacher/billing/route';

export default function BillingPage() {
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/teacher/billing')
      .then((r) => r.json())
      .then((data) => { setRows(data); setLoading(false); });
  }, []);

  const totalBalance = rows
    .filter((r) => r.balance != null)
    .reduce((sum, r) => sum + (r.balance ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Billing Summary</h1>
        <Link href="/teacher" className="text-sm text-blue-600 hover:underline">← Schedule</Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-10 text-center text-gray-400">
            No completed unpaid lessons yet.
          </div>
        ) : (
          <>
            {/* Total card */}
            <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-medium opacity-80">Total outstanding balance</p>
              <p className="text-3xl font-bold mt-1">
                {totalBalance > 0 ? `₪${totalBalance.toLocaleString()}` : '—'}
              </p>
              <p className="text-xs opacity-60 mt-1">{rows.length} student{rows.length !== 1 ? 's' : ''} with unpaid lessons</p>
            </div>

            {/* Per-student rows */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
              {rows.map((row) => {
                const isExpanded = expanded === row.student_email;
                return (
                  <div key={row.student_email}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : row.student_email)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{row.student_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{row.student_email}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm font-bold text-gray-900">
                          {row.balance != null ? `₪${row.balance.toLocaleString()}` : <span className="text-gray-400 font-normal">No rate set</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {row.completed_lessons} lesson{row.completed_lessons !== 1 ? 's' : ''}
                          {row.rate != null ? ` × ₪${row.rate}` : ''}
                        </p>
                      </div>
                      <span className="ml-3 text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4 bg-slate-50 border-t border-gray-100">
                        <table className="w-full text-xs mt-3">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-200">
                              <th className="text-left pb-2 font-medium">Date</th>
                              <th className="text-left pb-2 font-medium">Time</th>
                              <th className="text-left pb-2 font-medium">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {row.lessons.map((l, i) => (
                              <tr key={i}>
                                <td className="py-1.5 text-gray-700">{l.date}</td>
                                <td className="py-1.5 text-gray-700">{l.start_time}–{l.end_time}</td>
                                <td className="py-1.5 text-gray-400 capitalize">{l.booking_type.replace('_', '-')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {row.rate == null && (
                          <p className="text-xs text-amber-600 mt-3">
                            No rate set for this student. <Link href="/teacher/students" className="underline">Set rate →</Link>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
