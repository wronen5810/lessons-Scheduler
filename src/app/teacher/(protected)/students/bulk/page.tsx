'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Row {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface RowErrors {
  name?: string;
  email?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newRow(): Row {
  return { id: Math.random().toString(36).slice(2), name: '', email: '', phone: '' };
}

function looksLikeHeader(cols: string[]): boolean {
  const joined = cols.join(' ').toLowerCase();
  return ['name', 'email', 'phone', 'שם', 'אימייל', 'מייל', 'טלפון'].some((h) => joined.includes(h));
}

function parseTsv(text: string): Array<{ name: string; email: string; phone: string }> {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (!lines.length) return [];
  const firstCols = lines[0].split('\t');
  const dataLines = looksLikeHeader(firstCols) ? lines.slice(1) : lines;
  return dataLines
    .map((line) => {
      const cols = line.split('\t');
      return { name: (cols[0] ?? '').trim(), email: (cols[1] ?? '').trim(), phone: (cols[2] ?? '').trim() };
    })
    .filter((r) => r.name || r.email || r.phone);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BulkStudentsPage() {
  const router = useRouter();
  const { t, lang, isRTL } = useLanguage();

  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: 5 }, newRow));
  const [rowErrors, setRowErrors] = useState<Map<string, RowErrors>>(new Map());
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    apiErrors: { index: number; error: string }[];
  } | null>(null);

  // ── Cell update ────────────────────────────────────────────────────────────

  function updateCell(rowId: string, field: keyof Omit<Row, 'id'>, value: string) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));
    setRowErrors((prev) => {
      const m = new Map(prev);
      const err = m.get(rowId);
      if (!err) return m;
      const next = { ...err };
      delete (next as Record<string, string>)[field];
      if (Object.keys(next).length === 0) m.delete(rowId);
      else m.set(rowId, next);
      return m;
    });
  }

  // ── Row management ─────────────────────────────────────────────────────────

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function deleteRow(rowId: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rowId) : [newRow()]));
    setRowErrors((prev) => { const m = new Map(prev); m.delete(rowId); return m; });
  }

  // ── Paste handler ──────────────────────────────────────────────────────────

  function handlePaste(e: React.ClipboardEvent, rowIndex: number, colIndex: number) {
    const text = e.clipboardData.getData('text/plain');
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
    // Single value, no multi-cell content → let the browser handle it normally
    if (lines.length <= 1 && !text.includes('\t')) return;

    e.preventDefault();
    const hasTabs = text.includes('\t');
    const dataLines = hasTabs && looksLikeHeader(lines[0].split('\t')) ? lines.slice(1) : lines;

    setRows((prev) => {
      const next = [...prev];
      dataLines.forEach((line, i) => {
        const idx = rowIndex + i;
        const cols = line.split('\t');
        while (next.length <= idx) next.push(newRow());

        if (hasTabs) {
          // Multi-column paste: fill name | email | phone from col 0
          next[idx] = {
            ...next[idx],
            name: cols[0]?.trim() || next[idx].name,
            email: cols[1]?.trim() || next[idx].email,
            phone: cols[2]?.trim() || next[idx].phone,
          };
        } else {
          // Single-column paste: fill only the target column
          const fields: Array<keyof Omit<Row, 'id'>> = ['name', 'email', 'phone'];
          const field = fields[colIndex] ?? 'name';
          next[idx] = { ...next[idx], [field]: cols[0]?.trim() ?? '' };
        }
      });
      return next;
    });
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs = new Map<string, RowErrors>();
    const emailsSeen = new Set<string>();
    let hasErrors = false;

    rows.forEach((row) => {
      // Skip completely empty rows
      if (!row.name.trim() && !row.email.trim() && !row.phone.trim()) return;

      const err: RowErrors = {};
      if (!row.name.trim()) {
        err.name = lang === 'he' ? 'שם נדרש' : 'Name required';
        hasErrors = true;
      }
      if (!row.email.trim() && !row.phone.trim()) {
        err.email = lang === 'he' ? 'נדרש אימייל או טלפון' : 'Email or phone required';
        hasErrors = true;
      }
      if (row.email.trim()) {
        const key = row.email.toLowerCase();
        if (emailsSeen.has(key)) {
          err.email = lang === 'he' ? 'אימייל כפול' : 'Duplicate email';
          hasErrors = true;
        }
        emailsSeen.add(key);
      }
      if (Object.keys(err).length > 0) errs.set(row.id, err);
    });

    setRowErrors(errs);
    return !hasErrors;
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!validate()) return;
    const toSave = rows.filter((r) => r.name.trim() || r.email.trim() || r.phone.trim());
    if (toSave.length === 0) return;

    setSaving(true);
    const res = await fetch('/api/teacher/students/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: toSave }),
    });
    setSaving(false);

    if (res.ok) {
      const data = await res.json();
      setResult({ created: data.created ?? 0, updated: data.updated ?? 0, apiErrors: data.errors ?? [] });
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{t('common.done')}</p>
            {result.created > 0 && (
              <p className="text-sm text-gray-600 mt-1">{result.created} {t('students.bulkAdded')}</p>
            )}
            {result.updated > 0 && (
              <p className="text-sm text-gray-600">{result.updated} {t('students.bulkUpdated')}</p>
            )}
            {result.created === 0 && result.updated === 0 && result.apiErrors.length === 0 && (
              <p className="text-sm text-gray-400 mt-1">{lang === 'he' ? 'לא בוצעו שינויים' : 'No changes made'}</p>
            )}
          </div>
          {result.apiErrors.length > 0 && (
            <div className="text-start text-xs text-red-600 bg-red-50 rounded-xl p-3 space-y-1">
              {result.apiErrors.map((e) => (
                <p key={e.index}>
                  {lang === 'he' ? `שורה ${e.index + 1}` : `Row ${e.index + 1}`}: {e.error}
                </p>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push('/teacher/students')}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t('students.bulkGoBack')}
            </button>
            <button
              onClick={() => { setResult(null); setRows(Array.from({ length: 5 }, newRow)); setRowErrors(new Map()); }}
              className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              {t('students.bulkAddMore')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filledCount = rows.filter((r) => r.name.trim() || r.email.trim() || r.phone.trim()).length;

  // ── Main table ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/teacher/students')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900">{t('students.bulkEdit')}</h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{t('students.bulkSubtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || filledCount === 0}
          className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap flex-shrink-0"
        >
          {saving ? t('common.saving') : t('students.bulkSave')}
          {filledCount > 0 && !saving && ` (${filledCount})`}
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-8 px-2 py-2.5 text-xs font-medium text-gray-300 text-center">#</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 text-start w-[34%]">
                  {t('students.fullName')} <span className="text-red-400">*</span>
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 text-start w-[34%]">
                  {t('common.email')}
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-600 text-start">
                  {t('common.phone')}
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, rowIdx) => {
                const err = rowErrors.get(row.id);
                return (
                  <tr key={row.id} className={err ? 'bg-red-50/30' : 'hover:bg-gray-50/50'}>
                    {/* Row number */}
                    <td className="px-2 py-1 text-xs text-gray-300 text-center select-none">{rowIdx + 1}</td>

                    {/* Name */}
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={row.name}
                        placeholder={t('students.fullName')}
                        onChange={(e) => updateCell(row.id, 'name', e.target.value)}
                        onPaste={(e) => handlePaste(e, rowIdx, 0)}
                        title={err?.name}
                        className={`w-full px-2 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                          err?.name
                            ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-300'
                            : 'border-transparent hover:border-gray-200 focus:border-blue-400 bg-transparent'
                        }`}
                      />
                    </td>

                    {/* Email */}
                    <td className="px-1 py-1">
                      <input
                        type="email"
                        value={row.email}
                        placeholder="student@example.com"
                        onChange={(e) => updateCell(row.id, 'email', e.target.value)}
                        onPaste={(e) => handlePaste(e, rowIdx, 1)}
                        title={err?.email}
                        className={`w-full px-2 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                          err?.email
                            ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-300'
                            : 'border-transparent hover:border-gray-200 focus:border-blue-400 bg-transparent'
                        }`}
                      />
                    </td>

                    {/* Phone */}
                    <td className="px-1 py-1">
                      <input
                        type="tel"
                        value={row.phone}
                        placeholder="+972 50 000 0000"
                        onChange={(e) => updateCell(row.id, 'phone', e.target.value)}
                        onPaste={(e) => handlePaste(e, rowIdx, 2)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey && rowIdx === rows.length - 1) {
                            e.preventDefault();
                            addRow();
                            setTimeout(() => {
                              const inputs = document.querySelectorAll<HTMLInputElement>('tbody input[type="text"]');
                              inputs[inputs.length - 1]?.focus();
                            }, 30);
                          }
                        }}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-transparent hover:border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-400 bg-transparent transition-colors"
                      />
                    </td>

                    {/* Delete row */}
                    <td className="px-2 py-1 w-8">
                      <button
                        onClick={() => deleteRow(row.id)}
                        tabIndex={-1}
                        className="text-gray-200 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add row */}
          <div className="border-t border-gray-100 px-4 py-2">
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('students.bulkAddRow')}
            </button>
          </div>
        </div>

        {/* Validation summary */}
        {rowErrors.size > 0 && (
          <p className="text-xs text-red-500 text-center">
            {lang === 'he'
              ? `${rowErrors.size} שורות עם שגיאות — רחף על התא האדום לפרטים`
              : `${rowErrors.size} row${rowErrors.size !== 1 ? 's have' : ' has'} errors — hover the red cell for details`}
          </p>
        )}

        {/* Hint */}
        <p className="text-xs text-gray-400 text-center">
          {lang === 'he'
            ? 'טיפ: הדבק שורות מ-Excel או Google Sheets ישירות לתוך הטבלה'
            : 'Tip: paste rows directly from Excel or Google Sheets — headers are auto-detected'}
        </p>
      </main>
    </div>
  );
}
