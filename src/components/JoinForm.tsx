'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import SaderotLogo from '@/components/SaderotLogo';

type Step = 'email' | 'privacy' | 'not_found' | 'teachers';

interface Teacher {
  id: string;
  display_name: string;
}

interface TeacherPublicProfile {
  display_name: string;
  photo_url: string | null;
  description: string | null;
  bio: string | null;
  tutoring_area: string | null;
  quote: string | null;
  page_color: string;
}

const DEFAULT_COLOR = '#4A9E8A';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// hex → "RRGGBB" → luminance check so we know whether to use white or dark text
function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

export default function JoinForm({ teacherId }: { teacherId: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('email');
  const [identifier, setIdentifier] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [emailForRequest, setEmailForRequest] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);
  const [notified, setNotified] = useState(false);
  const [error, setError] = useState('');
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<TeacherPublicProfile | null>(null);

  useEffect(() => {
    fetch(`/api/teacher-profile/${teacherId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: TeacherPublicProfile | null) => { if (d) setTeacherProfile(d); })
      .catch(() => {});
  }, [teacherId]);

  const accent = teacherProfile?.page_color ?? DEFAULT_COLOR;
  const light = isLight(accent);
  const btnTextColor = light ? '#1a1a1a' : '#ffffff';
  const avatarBg = `${accent}22`;

  const isEmailIdentifier = identifier.includes('@');

  function storeTokens(tokens: Record<string, string>) {
    for (const [tid, tok] of Object.entries(tokens)) {
      localStorage.setItem(`st_${tid}`, tok);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/student-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, teacherId }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.status === 404 && data.not_registered) {
      setTeacherName(data.teacher_name ?? '');
      if (!isEmailIdentifier) setPhone(identifier.trim());
      setStep('not_found');
      return;
    }

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }

    if (data.tokens) storeTokens(data.tokens);

    const studentEmail: string = data.student_email || identifier.toLowerCase().trim();
    setResolvedEmail(studentEmail);

    if (!data.privacy_accepted) {
      setPendingTeachers(data.teachers);
      setTeacherName(data.teachers[0]?.display_name ?? '');
      setStep('privacy');
      return;
    }

    if (data.teachers.length === 1) {
      router.push(`/t/${data.teachers[0].id}?email=${encodeURIComponent(studentEmail)}`);
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
      body: JSON.stringify({ email: resolvedEmail, teacherIds: pendingTeachers.map((t) => t.id) }),
    });
    const data = res.ok ? await res.json() : {};
    if (data.tokens) storeTokens(data.tokens);
    setLoading(false);

    if (pendingTeachers.length === 1) {
      router.push(`/t/${pendingTeachers[0].id}?email=${encodeURIComponent(resolvedEmail)}`);
    } else {
      setTeachers(pendingTeachers);
      setStep('teachers');
    }
  }

  async function handleAccessRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !privacyChecked) return;
    setLoading(true);
    setError('');

    const emailToSend = isEmailIdentifier
      ? identifier.trim().toLowerCase()
      : emailForRequest.trim().toLowerCase();

    await fetch('/api/student-access-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailToSend,
        name: name.trim(),
        phone: phone.trim() || null,
        note: note.trim() || null,
        teacherId,
      }),
    });

    setLoading(false);
    setNotified(true);
  }

  // ── Shared page shell ─────────────────────────────────────────────────────
  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  function Avatar() {
    if (teacherProfile?.photo_url) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={teacherProfile.photo_url}
          alt={teacherProfile.display_name}
          className="w-16 h-16 rounded-full mx-auto object-cover"
        />
      );
    }
    return (
      <div
        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-xl font-semibold"
        style={{ backgroundColor: avatarBg, color: accent }}
      >
        {getInitials(teacherProfile?.display_name ?? '')}
      </div>
    );
  }

  // ── Styled button using accent color ──────────────────────────────────────
  function AccentButton({
    onClick,
    disabled,
    children,
    type = 'button',
  }: {
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    type?: 'button' | 'submit';
  }) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={{ backgroundColor: accent, color: btnTextColor }}
        className="w-full rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {children}
      </button>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (notified) {
    return (
      <Shell>
        <div className="px-6 py-10 text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: avatarBg }}
          >
            <svg className="w-6 h-6" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('join.requestSent')}</h2>
          <p className="text-sm text-gray-500">
            {teacherName ? t('join.requestSentDesc', { teacherName }) : t('join.requestSentGeneric')}
          </p>
        </div>
      </Shell>
    );
  }

  // ── Privacy step ──────────────────────────────────────────────────────────
  if (step === 'privacy') {
    return (
      <Shell>
        <div className="flex items-center justify-between px-6 pt-5">
          <SaderotLogo size="sm" />
          <LanguageToggle />
        </div>
        <div className="px-6 pb-6 pt-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('join.privacyTitle')}</h2>
          <p className="text-sm text-gray-500">{t('join.privacyIntro')}</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <p>We use your email, name, and lesson info solely to enable scheduling with your teacher. Your data is stored securely and never sold or shared.</p>
            <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline mt-2 inline-block">
              {t('join.readFullPolicy')} →
            </Link>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">{t('join.agreePrivacy')}</span>
          </label>
          <AccentButton onClick={handlePrivacyAccept} disabled={!privacyChecked || loading}>
            {loading ? t('common.continuing') : t('common.continue')}
          </AccentButton>
          <button
            type="button"
            onClick={() => { setStep('email'); setPrivacyChecked(false); setError(''); }}
            className="w-full text-sm text-gray-400 hover:text-gray-600"
          >
            {t('join.differentEmail')}
          </button>
        </div>
      </Shell>
    );
  }

  // ── Not found — access request ────────────────────────────────────────────
  if (step === 'not_found') {
    return (
      <Shell>
        <div className="px-6 py-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('join.notRegistered')}</h2>
          <p className="text-sm text-gray-500">
            {teacherName
              ? t('join.notRegisteredDesc', { identifier: identifier.trim(), teacherName })
              : t('join.notRegisteredGeneric', { identifier: identifier.trim() })}
          </p>
          <form onSubmit={handleAccessRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('students.fullName')} <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('students.fullName')}
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            {!isEmailIdentifier && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('join.emailAddress')} <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={emailForRequest}
                  onChange={(e) => setEmailForRequest(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('join.phoneNumber')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('join.phonePlaceholder')}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('join.note')} <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('join.notePlaceholder')}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{t('join.agreePrivacyLabel')}</span>
            </label>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <AccentButton
              type="submit"
              disabled={loading || !name.trim() || !privacyChecked || (!isEmailIdentifier && !emailForRequest.trim())}
            >
              {loading ? t('common.sending') : t('join.notifyTeacher')}
            </AccentButton>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600"
            >
              {t('join.differentEmail')}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  // ── Multiple teachers ─────────────────────────────────────────────────────
  if (step === 'teachers') {
    return (
      <Shell>
        <div className="px-6 py-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('join.chooseTeacher')}</h2>
          <div className="space-y-2">
            {teachers.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => router.push(`/t/${teacher.id}?email=${encodeURIComponent(resolvedEmail)}`)}
                className="w-full text-left border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {teacher.display_name}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setStep('email'); setIdentifier(''); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {t('common.back')}
          </button>
        </div>
      </Shell>
    );
  }

  // ── Main email step ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5">
          <SaderotLogo size="sm" />
          <LanguageToggle />
        </div>

        {/* Teacher card */}
        <div className="text-center px-6 pt-6 pb-5">
          <Avatar />

          <h1 className="text-xl font-bold text-gray-900 mt-3">
            {teacherProfile?.display_name ?? ''}
          </h1>

          {teacherProfile?.tutoring_area && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
              {teacherProfile.tutoring_area}
            </p>
          )}

          {teacherProfile?.quote && (
            <>
              <hr className="border-gray-100 my-3" />
              <p className="text-sm text-gray-500 italic">
                &ldquo;{teacherProfile.quote}&rdquo;
              </p>
            </>
          )}
        </div>

        {/* Student access section */}
        <div className="px-6 pb-6">
          {/* Divider */}
          <div className="relative flex items-center mb-4">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-3 text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Student Access
            </span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          <p className="text-sm text-gray-500 mb-4 text-center">
            Enter your email or phone to view your lessons.
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300 transition-colors"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <AccentButton type="submit" disabled={loading}>
              {loading ? t('join.lookingUp') : t('common.continue')}
            </AccentButton>
          </form>
        </div>
      </div>
    </div>
  );
}
