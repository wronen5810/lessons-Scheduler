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

  const totalLessons = rows.reduce((sum, r) => sum + r.completed_lessons, 0);
  const totalBalance = rows.filter((r) => r.balance != null).reduce((sum, r) => sum + (r.balance ?? 0), 0);

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
            No completed lessons yet.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-medium opacity-75">Total outstanding</p>
                <p className="text-2xl font-bold mt-0.5">
                  {totalBalance > 0 ? `₪${totalBalance.toLocaleString()}` : '—'}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-medium text-gray-500">Total lessons</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalLessons}</p>
                <p className="text-xs text-gray-400 mt-0.5">{rows.length} student{rows.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Per-student summary table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-4 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <div className="col-span-2">Student</div>
                <div className="text-center">Lessons</div>
                <div className="text-right">Balance</div>
              </div>

              {rows.map((row) => {
                const isExpanded = expanded === row.student_email;
                return (
                  <div key={row.student_email} className="divide-y divide-gray-50">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : row.student_email)}
                      className="w-full grid grid-cols-4 items-center px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="col-span-2 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{row.student_name}</p>
                        <p className="text-xs text-gray-400 truncate">{row.student_email}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-gray-900">{row.completed_lessons}</span>
                        {row.rate != null && (
                          <p className="text-xs text-gray-400">× ₪{row.rate}</p>
                        )}
                      </div>
                      <div className="text-right flex items-center justify-end gap-2">
                        <div>
                          {row.balance != null
                            ? <span className="text-sm font-bold text-gray-900">₪{row.balance.toLocaleString()}</span>
                            : <span className="text-xs text-amber-600 font-medium">No rate</span>
                          }
                        </div>
                        <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4 bg-slate-50 border-t border-gray-100">
                        <table className="w-full text-xs mt-3">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-200">
                              <th className="text-left pb-2 font-medium">Date</th>
                              <th className="text-left pb-2 font-medium">Time</th>
                              <th className="text-right pb-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {row.lessons.map((l, i) => (
                              <tr key={i}>
                                <td className="py-1.5 text-gray-700">{l.date}</td>
                                <td className="py-1.5 text-gray-700">{l.start_time}–{l.end_time}</td>
                                <td className="py-1.5 text-right">
                                  <span className={`px-1.5 py-0.5 rounded-full font-medium ${l.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {l.status === 'paid' ? 'Paid' : 'Completed'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {row.rate == null && (
                          <p className="text-xs text-amber-600 mt-3">
                            No rate set. <Link href="/teacher/students" className="underline">Set rate →</Link>
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
