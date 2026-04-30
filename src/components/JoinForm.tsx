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
}

export default function JoinForm({ teacherId }: { teacherId: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('email');
  const [identifier, setIdentifier] = useState('');  // what the user typed (email or phone)
  const [resolvedEmail, setResolvedEmail] = useState('');  // actual email from DB lookup
  const [emailForRequest, setEmailForRequest] = useState('');  // email field in not_found form when identifier is a phone
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
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTeacherProfile(d); })
      .catch(() => {});
  }, [teacherId]);

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
      body: JSON.stringify({ email: resolvedEmail, teacherIds: pendingTeachers.map(t => t.id) }),
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

    const emailToSend = isEmailIdentifier ? identifier.trim().toLowerCase() : emailForRequest.trim().toLowerCase();

    await fetch('/api/student-access-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToSend, name: name.trim(), phone: phone.trim() || null, note: note.trim() || null, teacherId }),
    });

    setLoading(false);
    setNotified(true);
  }

  if (notified) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('join.requestSent')}</h2>
        <p className="text-sm text-gray-500">
          {teacherName
            ? t('join.requestSentDesc', { teacherName })
            : t('join.requestSentGeneric')}
        </p>
      </div>
    );
  }

  if (step === 'privacy') {
    return (
      <>
        <SaderotLogo size="sm" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1 mt-5">{t('join.privacyTitle')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('join.privacyIntro')}</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm text-gray-600">
          <p>We use your email, name, and lesson info solely to enable scheduling with your teacher. Your data is stored securely and never sold or shared.</p>
          <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline mt-2 inline-block">
            {t('join.readFullPolicy')} →
          </Link>
        </div>
        <label className="flex items-start gap-3 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={privacyChecked}
            onChange={(e) => setPrivacyChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{t('join.agreePrivacy')}</span>
        </label>
        <button
          onClick={handlePrivacyAccept}
          disabled={!privacyChecked || loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t('common.continuing') : t('common.continue')}
        </button>
        <button
          type="button"
          onClick={() => { setStep('email'); setPrivacyChecked(false); setError(''); }}
          className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600"
        >
          {t('join.differentEmail')}
        </button>
      </>
    );
  }

  if (step === 'not_found') {
    return (
      <>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('join.notRegistered')}</h2>
        <p className="text-sm text-gray-500 mb-6">
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('join.note')} <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('join.notePlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{t('join.agreePrivacyLabel')}</span>
          </label>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !name.trim() || !privacyChecked || (!isEmailIdentifier && !emailForRequest.trim())}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('common.sending') : t('join.notifyTeacher')}
          </button>
          <button
            type="button"
            onClick={() => { setStep('email'); setError(''); }}
            className="w-full text-sm text-gray-400 hover:text-gray-600"
          >
            {t('join.differentEmail')}
          </button>
        </form>
      </>
    );
  }

  if (step === 'teachers') {
    return (
      <>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('join.chooseTeacher')}</h2>
        <div className="space-y-2">
          {teachers.map((teacher) => (
            <button
              key={teacher.id}
              onClick={() => router.push(`/t/${teacher.id}?email=${encodeURIComponent(resolvedEmail)}`)}
              className="w-full text-left border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-blue-400 transition-colors"
            >
              {teacher.display_name}
            </button>
          ))}
        </div>
        <button onClick={() => { setStep('email'); setIdentifier(''); }} className="mt-4 text-xs text-gray-400 hover:text-gray-600">
          {t('common.back')}
        </button>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <SaderotLogo size="sm" />
        <LanguageToggle />
      </div>

      {/* Teacher profile */}
      {teacherProfile && (
        <div className="text-center mb-5">
          {teacherProfile.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={teacherProfile.photo_url}
              alt={teacherProfile.display_name}
              className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-gray-100 shadow-sm"
            />
          )}
          <h1 className="text-lg font-bold text-gray-900">{teacherProfile.display_name}</h1>
          {teacherProfile.description && (
            <p className="text-sm text-gray-500 mt-1">{teacherProfile.description}</p>
          )}
          {teacherProfile.bio && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{teacherProfile.bio}</p>
          )}
        </div>
      )}

      <div className="mb-1">
        <h2 className="text-lg font-semibold text-gray-900">{t('join.title')}</h2>
      </div>
      {teacherName && (
        <p className="text-sm text-gray-500 mb-5">{t('join.enterEmailWith', { teacherName })}</p>
      )}
      {!teacherName && (
        <p className="text-sm text-gray-500 mb-5">{t('join.enterEmailGeneric')}</p>
      )}
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('join.emailOrPhone')}</label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t('join.emailPlaceholder')}
            autoFocus
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
          {loading ? t('join.lookingUp') : t('common.continue')}
        </button>
      </form>
    </>
  );
}
