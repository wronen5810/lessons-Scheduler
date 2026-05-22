'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BillingRow, GroupBillingRow } from '@/app/api/teacher/billing/route';
import type { ReceiptData } from '@/app/api/teacher/receipts/route';
import { ReceiptDocument } from '@/components/ReceiptDocument';
import { useLanguage } from '@/contexts/LanguageContext';

type ReminderTarget = { studentId: string; studentName: string; balance: number | null };
type PaymentTarget = { studentId: string; studentName: string };
type ReceiptStudent = { id: string; name: string };
type PaymentItem = { id: string; student_id: string; amount: number; note: string | null; paid_at: string; booking_id: string | null; booking_type: string | null; receipt_number: string | null };

function formatReminderDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2l-3 2-3-2-3 2-3-2z"/>
      <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>
    </svg>
  );
}

export default function BillingPage() {
  const { t, isRTL } = useLanguage();
  const [individual, setIndividual] = useState<BillingRow[]>([]);
  const [groupBilling, setGroupBilling] = useState<GroupBillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Payment modal state
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Receipt state
  const [receiptStudent, setReceiptStudent] = useState<ReceiptStudent | null>(null);
  const [paymentsForReceipt, setPaymentsForReceipt] = useState<PaymentItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptGenerating, setReceiptGenerating] = useState<string | null>(null);

  // All-students picker (for receipt search)
  const [allStudents, setAllStudents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [receiptPick, setReceiptPick] = useState('');

  // Reminder modal state
  const [reminderTarget, setReminderTarget] = useState<ReminderTarget | null>(null);
  const [reminderChannels, setReminderChannels] = useState({ email: true, whatsapp: false, notification: false });
  const [reminderMsg, setReminderMsg] = useState('');
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [reminderError, setReminderError] = useState('');

  useEffect(() => {
    fetch('/api/teacher/students')
      .then((r) => r.ok ? r.json() : [])
      .then((data: { id: string; name: string; email: string }[]) =>
        setAllStudents(Array.isArray(data) ? [...data].sort((a, b) => a.name.localeCompare(b.name)) : [])
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/teacher/billing')
      .then((r) => {
        if (r.status === 401) throw new Error('auth');
        if (!r.ok) throw new Error(`server:${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) { setFetchError(data.error); return; }
        setIndividual(data.individual ?? []);
        setGroupBilling(data.groups ?? []);
      })
      .catch((err: Error) => {
        if (err.message === 'auth') {
          setFetchError('Session expired. Please sign out and sign back in.');
        } else {
          setFetchError('Failed to load billing data. Please refresh the page.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function recordPayment() {
    if (!paymentTarget) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) { setPaymentError('Enter a valid amount'); return; }
    setPaymentSaving(true);
    setPaymentError('');
    try {
      const res = await fetch('/api/teacher/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: paymentTarget.studentId, amount, note: paymentNote || undefined }),
      });
      if (!res.ok) throw new Error('failed');
      const payment = await res.json();
      setIndividual((prev) => prev.map((r) => {
        if (r.student_id !== paymentTarget.studentId) return r;
        const newCredits = r.unallocated_credits + amount;
        return {
          ...r,
          unallocated_credits: newCredits,
          net_balance: r.balance != null ? Math.max(0, r.balance - newCredits) : null,
          payments: [{ id: payment.id, amount, note: paymentNote || null, paid_at: payment.paid_at, booking_id: null }, ...r.payments],
        };
      }));
      setPaymentTarget(null);
      setPaymentAmount('');
      setPaymentNote('');
    } catch {
      setPaymentError('Failed to record payment. Please try again.');
    } finally {
      setPaymentSaving(false);
    }
  }

  const totalIndividualBalance = individual.filter((r) => r.net_balance != null).reduce((sum, r) => sum + (r.net_balance ?? 0), 0);
  const totalGroupBalance = groupBilling.filter((r) => r.total_balance != null).reduce((sum, r) => sum + (r.total_balance ?? 0), 0);
  const totalBalance = totalIndividualBalance + totalGroupBalance;
  const totalLessons = individual.reduce((sum, r) => sum + r.completed_lessons, 0)
    + groupBilling.reduce((sum, r) => sum + r.completed_lessons, 0);

  const hasData = individual.length > 0 || groupBilling.length > 0;

  async function openReceiptModal(studentId: string, studentName: string) {
    setReceiptStudent({ id: studentId, name: studentName });
    setPaymentsForReceipt([]);
    setReceiptData(null);
    setPaymentsLoading(true);
    try {
      const res = await fetch(`/api/teacher/payments?student_id=${studentId}`);
      const data = await res.json();
      setPaymentsForReceipt(Array.isArray(data) ? data : []);
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function generateReceipt(paymentId: string) {
    setReceiptGenerating(paymentId);
    try {
      const res = await fetch('/api/teacher/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setReceiptData(data);
        setPaymentsForReceipt((prev) =>
          prev.map((p) => p.id === paymentId ? { ...p, receipt_number: data.receipt_number } : p)
        );
      }
    } finally {
      setReceiptGenerating(null);
    }
  }

  function printReceipt() {
    const el = document.getElementById('receipt-document');
    if (!el) return;

    const printLabel = isRTL ? 'הדפס / שמור PDF' : 'Print / Save PDF';
    const html = [
      '<!DOCTYPE html>',
      `<html lang="${isRTL ? 'he' : 'en'}" dir="${isRTL ? 'rtl' : 'ltr'}">`,
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width,initial-scale=1">',
      `<title>Receipt${receiptData?.receipt_number ? ' #' + receiptData.receipt_number : ''}</title>`,
      '<style>',
      '*{margin:0;padding:0;box-sizing:border-box}',
      "body{background:#f1f5f9;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:20px;gap:14px;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}",
      '.pbtn{padding:10px 28px;background:#1e293b;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:.2px}',
      '@media print{.pbtn{display:none!important}body{background:white;padding:0;display:block}}',
      '</style>',
      '</head>',
      '<body>',
      `<button class="pbtn" onclick="window.print()">🖨 ${printLabel}</button>`,
      el.outerHTML,
      '<script>',
      'try{setTimeout(function(){window.print();},400);}catch(e){}',
      '<\/script>',
      '</body>',
      '</html>',
    ].join('');

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    // Fallback when popup is blocked (e.g. some browsers or desktop policy)
    if (!opened) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptData?.receipt_number ?? 'download'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  function openReminder(studentId: string, studentName: string, balance: number | null) {
    const amount = balance != null && balance > 0 ? `₪${balance.toLocaleString()}` : null;
    const msg = amount
      ? `שלום ${studentName}, תזכורת ידידותית שיש לך יתרת חוב פתוחה בסך ${amount}. אשמח שתסדר את התשלום בהקדם האפשרי.`
      : `שלום ${studentName}, תזכורת ידידותית בנוגע ליתרת החוב הפתוחה שלך. אנא צור/י קשר לפרטי תשלום.`;
    setReminderTarget({ studentId, studentName, balance });
    setReminderChannels({ email: true, whatsapp: false, notification: false });
    setReminderMsg(msg);
    setReminderSent(false);
    setReminderError('');
  }

  async function sendReminder() {
    if (!reminderTarget) return;
    if (!reminderChannels.email && !reminderChannels.whatsapp && !reminderChannels.notification) {
      setReminderError('Select at least one channel.');
      return;
    }
    setReminderSending(true);
    setReminderError('');
    try {
      const res = await fetch('/api/teacher/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: [reminderTarget.studentId],
          message: reminderMsg,
          channels: reminderChannels,
        }),
      });
      if (!res.ok) throw new Error('send failed');
      const now = new Date().toISOString();
      setIndividual((prev) =>
        prev.map((r) => r.student_id === reminderTarget.studentId ? { ...r, last_reminder_at: now } : r)
      );
      setGroupBilling((prev) =>
        prev.map((g) => ({
          ...g,
          members: g.members.map((m) => m.student_id === reminderTarget.studentId ? { ...m, last_reminder_at: now } : m),
        }))
      );
      setReminderSent(true);
      setTimeout(() => setReminderTarget(null), 1500);
    } catch {
      setReminderError('Failed to send. Please try again.');
    } finally {
      setReminderSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <h1 className="text-lg font-bold text-gray-900">{t('billing.summary')}</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Receipt search — always visible once students are loaded */}
        {allStudents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
              {isRTL ? 'קבלות לפי תלמיד' : 'Receipts by Student'}
            </p>
            <div className="flex gap-2">
              <select
                value={receiptPick}
                onChange={(e) => setReceiptPick(e.target.value)}
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{isRTL ? 'בחר תלמיד...' : 'Select a student…'}</option>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.email ? ` · ${s.email}` : ''}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const s = allStudents.find((x) => x.id === receiptPick);
                  if (s) { openReceiptModal(s.id, s.name); setReceiptPick(''); }
                }}
                disabled={!receiptPick}
                className="flex-shrink-0 text-sm px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors font-medium"
              >
                {isRTL ? 'פתח' : 'Open'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>
        ) : fetchError ? (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm px-6 py-10 text-center space-y-2">
            <p className="text-red-500 text-sm">{fetchError}</p>
          </div>
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
                      <div
                        onClick={() => setExpanded(isExpanded ? null : row.student_email)}
                        className="w-full grid grid-cols-4 items-center px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
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
                          <div className="text-end">
                            {row.net_balance != null ? (
                              <span className="text-sm font-bold text-gray-900">₪{row.net_balance.toLocaleString()}</span>
                            ) : row.balance != null ? (
                              <span className="text-sm font-bold text-gray-900">₪{row.balance.toLocaleString()}</span>
                            ) : (
                              <span className="text-xs text-amber-600 font-medium">{t('billing.noRate')}</span>
                            )}
                            {row.unallocated_credits > 0 && (
                              <p className="text-xs text-emerald-600 mt-0.5">₪{row.unallocated_credits.toLocaleString()} {isRTL ? 'קרדיט' : 'credit'}</p>
                            )}
                            {row.last_reminder_at && (
                              <p className="text-xs text-blue-400 mt-0.5">{t('billing.reminderSentOn').replace('{date}', formatReminderDate(row.last_reminder_at))}</p>
                            )}
                          </div>
                          {row.student_id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPaymentTarget({ studentId: row.student_id!, studentName: row.student_name }); setPaymentAmount(''); setPaymentNote(''); setPaymentError(''); }}
                              title={isRTL ? 'רשום תשלום' : 'Record payment'}
                              className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 p-1 rounded transition-colors flex-shrink-0"
                            >
                              <PlusIcon />
                            </button>
                          )}
                          {row.student_id && row.net_balance != null && row.net_balance > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openReminder(row.student_id!, row.student_name, row.net_balance); }}
                              title={t('billing.sendReminder')}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors flex-shrink-0"
                            >
                              <BellIcon />
                            </button>
                          )}
                          {row.student_id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openReceiptModal(row.student_id!, row.student_name); }}
                              title={isRTL ? 'קבלות' : 'Receipts'}
                              className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1 rounded transition-colors flex-shrink-0"
                            >
                              <ReceiptIcon />
                            </button>
                          )}
                          <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

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
                          {row.payments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                {isRTL ? 'תשלומים לא מוקצים' : 'Unallocated payments'}
                              </p>
                              <div className="space-y-1">
                                {row.payments.map((p) => (
                                  <div key={p.id} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{new Date(p.paid_at).toLocaleDateString()}{p.note ? ` · ${p.note}` : ''}</span>
                                    <span className="font-semibold text-emerald-700">+₪{Number(p.amount).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                      <div className="flex items-center gap-2">
                                        {m.unpaid_lessons < row.completed_lessons && (
                                          <span className="text-emerald-600 font-medium">
                                            {row.completed_lessons - m.unpaid_lessons} {t('billing.paid')}
                                          </span>
                                        )}
                                        {m.unpaid_lessons > 0 ? (
                                          <>
                                            <span className="font-semibold text-gray-900">
                                              ₪{m.unpaid_balance != null ? m.unpaid_balance.toFixed(0) : '—'} {t('billing.owed')}
                                            </span>
                                            <button
                                              onClick={() => openReminder(m.student_id, m.student_name, m.unpaid_balance)}
                                              title={t('billing.sendReminder')}
                                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors flex-shrink-0"
                                            >
                                              <BellIcon />
                                            </button>
                                          </>
                                        ) : (
                                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">
                                            {t('billing.allPaid')}
                                          </span>
                                        )}
                                      </div>
                                      {m.last_reminder_at && (
                                        <span className="text-blue-400" style={{ fontSize: '10px' }}>
                                          {t('billing.reminderSentOn').replace('{date}', formatReminderDate(m.last_reminder_at))}
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

      {/* ── Payments & Receipts modal ── */}
      {receiptStudent && !receiptData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={() => setReceiptStudent(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{isRTL ? 'תשלומים וקבלות' : 'Payments & Receipts'}</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{receiptStudent.name}</p>
              </div>
              <button onClick={() => setReceiptStudent(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {paymentsLoading ? (
              <p className="text-xs text-gray-400 text-center py-4">{t('common.loading')}</p>
            ) : paymentsForReceipt.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">{isRTL ? 'אין תשלומים רשומים' : 'No payments recorded'}</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {paymentsForReceipt.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900">₪{Number(p.amount).toLocaleString()}</span>
                        {p.booking_id ? (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{isRTL ? 'שיעור' : 'Lesson'}</span>
                        ) : (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">{isRTL ? 'קרדיט' : 'Credit'}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(p.paid_at).toLocaleDateString()}{p.note ? ` · ${p.note}` : ''}</p>
                      {p.receipt_number && (
                        <p className="text-xs text-blue-500 mt-0.5 font-medium">#{p.receipt_number}</p>
                      )}
                    </div>
                    <button
                      onClick={() => generateReceipt(p.id)}
                      disabled={receiptGenerating === p.id}
                      className="flex-shrink-0 text-xs bg-gray-900 text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {receiptGenerating === p.id ? '...' : p.receipt_number ? (isRTL ? 'פתח' : 'Open') : (isRTL ? 'צור קבלה' : 'Generate')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Receipt preview modal ── */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={() => setReceiptData(null)}>
          <div className="w-full max-w-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-1">
              <button
                onClick={() => setReceiptData(null)}
                className="text-white/80 hover:text-white text-sm flex items-center gap-1.5"
              >
                ← {isRTL ? 'חזרה' : 'Back'}
              </button>
              <button
                onClick={printReceipt}
                className="bg-white text-gray-900 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                🖨 {isRTL ? 'הדפס / שמור PDF' : 'Print / Save PDF'}
              </button>
            </div>
            {/* Receipt */}
            <ReceiptDocument data={receiptData} lang={isRTL ? 'he' : 'en'} />
          </div>
        </div>
      )}

      {/* ── Record Payment modal ── */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={() => setPaymentTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{isRTL ? 'רשום תשלום' : 'Record payment'}</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{paymentTarget.studentName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{isRTL ? 'תשלום שלא מוקצה לשיעור ספציפי' : 'Payment not allocated to a specific lesson'}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{isRTL ? 'סכום (₪)' : 'Amount (₪)'}</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{isRTL ? 'הערה (אופציונלי)' : 'Note (optional)'}</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder={isRTL ? 'מזומן, העברה...' : 'Cash, bank transfer...'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {paymentError && <p className="text-xs text-red-500">{paymentError}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setPaymentTarget(null)} className="flex-1 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={recordPayment}
                disabled={paymentSaving || !paymentAmount}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {paymentSaving ? (isRTL ? 'שומר...' : 'Saving...') : (isRTL ? 'שמור תשלום' : 'Save payment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reminder modal ── */}
      {reminderTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={() => setReminderTarget(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('billing.reminderTitle')}</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{reminderTarget.studentName}</p>
              {reminderTarget.balance != null && reminderTarget.balance > 0 && (
                <p className="text-sm text-gray-500">₪{reminderTarget.balance.toLocaleString()} {t('billing.owed')}</p>
              )}
            </div>

            {/* Channel selection */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('wizard.sendVia')}</p>
              {[
                { key: 'email' as const, label: 'Email' },
                { key: 'whatsapp' as const, label: 'WhatsApp' },
                { key: 'notification' as const, label: t('messages.notification') },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderChannels[key]}
                    onChange={(e) => setReminderChannels((c) => ({ ...c, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('wizard.messageLabel')}</p>
              <textarea
                rows={4}
                value={reminderMsg}
                onChange={(e) => setReminderMsg(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {reminderError && <p className="text-xs text-red-500">{reminderError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setReminderTarget(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={sendReminder}
                disabled={reminderSending || reminderSent}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {reminderSent ? '✓ Sent' : reminderSending ? t('common.sending') : t('billing.sendReminder')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
