'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PendingStudentRow, PendingGroupRow, PendingLessonsResponse } from '@/app/api/teacher/pending-lessons/route';

function formatDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function LessonCard({ lesson, lang, today }: { lesson: { date: string; start_time: string; end_time: string; status: string }; lang: string; today: string }) {
  const isPast = lesson.date < today;
  const statusLabel = lang === 'he'
    ? lesson.status === 'approved' ? 'מאושר' : 'ממתין לאישור'
    : lesson.status === 'approved' ? 'Approved' : 'Pending approval';

  return (
    <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-gray-100 shadow-xs">
      <div>
        <p className={`text-sm font-medium ${isPast ? 'text-red-600' : 'text-gray-900'}`}>
          {formatDate(lesson.date, lang)}
          {isPast && (
            <span className="ms-2 text-xs font-normal text-red-400">
              {lang === 'he' ? '· לא סומן כהושלם' : '· not marked complete'}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400">{lesson.start_time} – {lesson.end_time}</p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
        lesson.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {statusLabel}
      </span>
    </div>
  );
}

export default function PendingLessonsPage() {
  const { lang, isRTL } = useLanguage();
  const [students, setStudents] = useState<PendingStudentRow[]>([]);
  const [groups, setGroups] = useState<PendingGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [includePast, setIncludePast] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/teacher/pending-lessons${includePast ? '?includePast=1' : ''}`)
      .then((r) => {
        if (!r.ok) throw new Error('failed');
        return r.json();
      })
      .then((data: PendingLessonsResponse) => {
        setStudents(data.students ?? []);
        setGroups(data.groups ?? []);
        setExpanded(null);
      })
      .catch(() => setError(lang === 'he' ? 'שגיאה בטעינת הנתונים' : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [includePast, lang]);

  const totalLessons = students.reduce((s, r) => s + r.count, 0) + groups.reduce((s, r) => s + r.count, 0);
  const totalEntities = students.length + groups.length;
  const hasData = students.length > 0 || groups.length > 0;

  const title = lang === 'he' ? 'שיעורים ממתינים' : 'Pending Lessons';
  const emptyMsg = lang === 'he' ? 'אין שיעורים ממתינים' : 'No pending lessons';

  function SectionTable({ rows, keyFn, nameFn, subFn }: {
    rows: (PendingStudentRow | PendingGroupRow)[];
    keyFn: (r: PendingStudentRow | PendingGroupRow) => string;
    nameFn: (r: PendingStudentRow | PendingGroupRow) => string;
    subFn: (r: PendingStudentRow | PendingGroupRow) => string;
  }) {
    return (
      <div className="divide-y divide-gray-100">
        {rows.map((row) => {
          const key = keyFn(row);
          const isOpen = expanded === key;
          return (
            <div key={key}>
              <div
                onClick={() => setExpanded(isOpen ? null : key)}
                className="grid grid-cols-3 items-center px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="col-span-2 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{nameFn(row)}</p>
                  <p className="text-xs text-gray-400 truncate">{subFn(row)}</p>
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
                    {row.count}
                  </span>
                </div>
              </div>
              {isOpen && (
                <div className="bg-slate-50 px-5 py-3 space-y-2">
                  {row.lessons.map((lesson, i) => (
                    <LessonCard key={i} lesson={lesson} lang={lang} today={today} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-gray-500">
            {lang === 'he' ? 'כולל עבר' : 'Include past'}
          </span>
          <button
            role="switch"
            aria-checked={includePast}
            onClick={() => setIncludePast((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${includePast ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${includePast ? 'translate-x-4' : 'translate-x-1'} ${isRTL ? (includePast ? '-translate-x-4' : '-translate-x-1') : ''}`} />
          </button>
        </label>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {lang === 'he' ? 'טוען...' : 'Loading...'}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm px-6 py-10 text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : !hasData ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-10 text-center text-gray-400 text-sm">
            {emptyMsg}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-medium opacity-75">
                  {lang === 'he' ? 'סה"כ שיעורים' : 'Total lessons'}
                </p>
                <p className="text-2xl font-bold mt-0.5">{totalLessons}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-medium text-gray-500">
                  {lang === 'he' ? 'תלמידים וקבוצות' : 'Students & groups'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalEntities}</p>
                {groups.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {students.length} {lang === 'he' ? 'תלמידים' : 'students'} · {groups.length} {lang === 'he' ? 'קבוצות' : 'groups'}
                  </p>
                )}
              </div>
            </div>

            {/* Column headers */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <div className="col-span-2">{lang === 'he' ? 'תלמיד / קבוצה' : 'Student / Group'}</div>
                <div className="text-center">{lang === 'he' ? 'שיעורים' : 'Lessons'}</div>
              </div>

              {/* Individual students */}
              {students.length > 0 && (
                <>
                  {groups.length > 0 && (
                    <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {lang === 'he' ? 'תלמידים פרטיים' : 'Individual students'}
                      </p>
                    </div>
                  )}
                  <SectionTable
                    rows={students}
                    keyFn={(r) => (r as PendingStudentRow).student_email}
                    nameFn={(r) => (r as PendingStudentRow).student_name}
                    subFn={(r) => (r as PendingStudentRow).student_email}
                  />
                </>
              )}

              {/* Groups */}
              {groups.length > 0 && (
                <>
                  <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {lang === 'he' ? 'קבוצות' : 'Groups'}
                    </p>
                  </div>
                  <SectionTable
                    rows={groups}
                    keyFn={(r) => `grp:${(r as PendingGroupRow).group_id}`}
                    nameFn={(r) => (r as PendingGroupRow).group_name}
                    subFn={() => lang === 'he' ? 'שיעור קבוצתי' : 'Group lesson'}
                  />
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
