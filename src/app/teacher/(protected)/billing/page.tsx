'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BillingRow, GroupBillingRow } from '@/app/api/teacher/billing/route';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BillingPage() {
  const { t, isRTL } = useLanguage();
  const [individual, setIndividual] = useState<BillingRow[]>([]);
  const [groupBilling, setGroupBilling] = useState<GroupBillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/teacher/billing')
      .then((r) => r.json())
      .then((data) => {
        setIndividual(data.individual ?? []);
        setGroupBilling(data.groups ?? []);
        setLoading(false);
      });
  }, []);

  const totalIndividualBalance = individual.filter((r) => r.balance != null).reduce((sum, r) => sum + (r.balance ?? 0), 0);
  const totalGroupBalance = groupBilling.filter((r) => r.total_balance != null).reduce((sum, r) => sum + (r.total_balance ?? 0), 0);
  const totalBalance = totalIndividualBalance + totalGroupBalance;
  const totalLessons = individual.reduce((sum, r) => sum + r.completed_lessons, 0)
    + groupBilling.reduce((sum, r) => sum + r.completed_lessons, 0);

  const hasData = individual.length > 0 || groupBilling.length > 0;

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <h1 className="text-lg font-bold text-gray-900">{t('billing.summary')}</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>
        ) : !hasData ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-10 text-center text-gray-400">
            {t('billing.noLessons')}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-medium opacity-75">{t('billing.totalUnpaid')}</p>
                <p className="text-2xl font-bold mt-0.5">
                  {totalBalance > 0 ? `₪${totalBalance.toLocaleString()}` : '—'}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-medium text-gray-500">{t('billing.totalLessons')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalLessons}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {individual.length} {t('common.students').toLowerCase()}
                  {groupBilling.length > 0 ? ` · ${groupBilling.length} ${t('common.groups').toLowerCase()}` : ''}
                </p>
              </div>
            </div>

            {/* ── Individual billing ── */}
            {individual.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('billing.individualStudents')}</p>
                </div>
                <div className="grid grid-cols-4 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <div className="col-span-2">{t('billing.student')}</div>
                  <div className="text-center">{t('billing.lessons')}</div>
                  <div className="text-end">{t('billing.balance')}</div>
                </div>

                {individual.map((row) => {
                  const isExpanded = expanded === row.student_email;
                  return (
                    <div key={row.student_email} className="divide-y divide-gray-50">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : row.student_email)}
                        className="w-full grid grid-cols-4 items-center px-5 py-3.5 hover:bg-slate-50 transition-colors text-start"
                      >
                        <div className="col-span-2 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{row.student_name}</p>
                          <p className="text-xs text-gray-400 truncate">{row.student_email}</p>
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-bold text-gray-900">{row.completed_lessons}</span>
                          {row.rate != null && <p className="text-xs text-gray-400">× ₪{row.rate}</p>}
                        </div>
                        <div className="text-end flex items-center justify-end gap-2">
                          <div>
                            {row.balance != null
                              ? <span className="text-sm font-bold text-gray-900">₪{row.balance.toLocaleString()}</span>
                              : <span className="text-xs text-amber-600 font-medium">{t('billing.noRate')}</span>
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
                                <th className="text-start pb-2 font-medium">{t('billing.date')}</th>
                                <th className="text-start pb-2 font-medium">{t('billing.time')}</th>
                                <th className="text-end pb-2 font-medium">{t('billing.status')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {row.lessons.map((l, i) => (
                                <tr key={i}>
                                  <td className="py-1.5 text-gray-700">{l.date}</td>
                                  <td className="py-1.5 text-gray-700">{l.start_time}–{l.end_time}</td>
                                  <td className="py-1.5 text-end">
                                    <span className="px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                                      {t('billing.completed')}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {row.rate == null && (
                            <p className="text-xs text-amber-600 mt-3">
                              {t('billing.noRate')}. <Link href="/teacher/students" className="underline">{t('billing.setRate')} →</Link>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Group billing ── */}
            {groupBilling.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('billing.groupLessons')}</p>
                </div>

                {groupBilling.map((row) => {
                  const isExpanded = expandedGroup === row.group_id;
                  return (
                    <div key={row.group_id} className="divide-y divide-gray-50">
                      <button
                        onClick={() => setExpandedGroup(isExpanded ? null : row.group_id)}
                        className="w-full px-5 py-3.5 hover:bg-slate-50 transition-colors text-start"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{row.group_name}</p>
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                {row.member_count} {t('common.students').toLowerCase()}
                              </span>
                            </div>
                            <div className="flex gap-3 mt-0.5">
                              <p className="text-xs text-gray-400">{row.completed_lessons} {t('billing.lessons').toLowerCase()}</p>
                              {row.per_student_rate != null && (
                                <p className="text-xs text-gray-400">₪{row.per_student_rate.toFixed(0)}/student/lesson</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 text-end">
                            <div>
                              {row.rate != null ? (
                                row.total_balance != null && row.total_balance > 0 ? (
                                  <p className="text-sm font-bold text-gray-900">₪{row.total_balance.toLocaleString()} {t('billing.owed')}</p>
                                ) : (
                                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{t('billing.allPaid')}</span>
                                )
                              ) : (
                                <span className="text-xs text-amber-600 font-medium">{t('billing.noRate')}</span>
                              )}
                            </div>
                            <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-4 bg-slate-50 border-t border-gray-100 space-y-4">
                          {row.members.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('common.students')}</p>
                              <div className="space-y-1.5">
                                {row.members.map((m) => (
                                  <div key={m.student_id} className="flex items-center justify-between text-xs">
                                    <div>
                                      <span className="font-medium text-gray-700">{m.student_name}</span>
                                      <span className="text-gray-400 ms-2">{m.student_email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {m.unpaid_lessons < row.completed_lessons && (
                                        <span className="text-emerald-600 font-medium">
                                          {row.completed_lessons - m.unpaid_lessons} {t('billing.paid')}
                                        </span>
                                      )}
                                      {m.unpaid_lessons > 0 ? (
                                        <span className="font-semibold text-gray-900">
                                          ₪{m.unpaid_balance != null ? m.unpaid_balance.toFixed(0) : '—'} {t('billing.owed')}
                                        </span>
                                      ) : (
                                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">
                                          {t('billing.allPaid')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('billing.lessons')}</p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-400 border-b border-gray-200">
                                  <th className="text-start pb-2 font-medium">{t('billing.date')}</th>
                                  <th className="text-start pb-2 font-medium">{t('billing.time')}</th>
                                  <th className="text-end pb-2 font-medium">{t('billing.status')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {row.lessons.map((l, i) => (
                                  <tr key={i}>
                                    <td className="py-1.5 text-gray-700">{l.date}</td>
                                    <td className="py-1.5 text-gray-700">{l.start_time}–{l.end_time}</td>
                                    <td className="py-1.5 text-end">
                                      <span className="px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                                        {t('billing.completed')}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {row.rate == null && (
                            <p className="text-xs text-amber-600">
                              {t('billing.noRate')}. <Link href="/teacher/students" className="underline">{t('billing.editGroup')} →</Link>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
