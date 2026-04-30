'use client';

import { useState, useEffect, useRef } from 'react';
import type { TeacherSettings, TeacherFeatures } from '@/app/api/teacher/settings/route';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationChannels,
  type NotificationKey,
  type NotificationPreferences,
} from '@/lib/notifications';

interface Props {
  settings: TeacherSettings;
  onSave: (updates: Partial<TeacherSettings>) => Promise<TeacherSettings>;
  onClose: () => void;
}

const NOTIFICATION_ROWS: { key: NotificationKey; label: string; direction: string }[] = [
  { key: 'lesson_request',   label: 'New lesson request',   direction: '→ you' },
  { key: 'lesson_approved',  label: 'Lesson approved',      direction: '→ student' },
  { key: 'lesson_rejected',  label: 'Lesson rejected',      direction: '→ student' },
  { key: 'lesson_cancelled', label: 'Lesson cancelled',     direction: '→ student' },
  { key: 'lesson_reminder',  label: 'Lesson reminder',      direction: '→ student' },
  { key: 'access_request',   label: 'New student request',  direction: '→ you' },
];

type Tab = 'general' | 'profile';

export default function TeacherSettingsModal({ settings, onSave, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  // ── General settings state ──
  const [duration, setDuration] = useState(settings.default_duration_minutes);
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>(settings.time_format);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...settings.notification_preferences,
  });
  const [features, setFeatures] = useState<TeacherFeatures>({
    billing:             settings.features?.billing             ?? false,
    messages:            settings.features?.messages            ?? false,
    groups:              settings.features?.groups              ?? false,
    notebook:            settings.features?.notebook            ?? false,
    allow_cancellation:  settings.features?.allow_cancellation  ?? false,
    policies_accepted_at: settings.features?.policies_accepted_at ?? null,
  });

  // ── Profile state ──
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [showPhoto, setShowPhoto] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [tutoringArea, setTutoringArea] = useState('');
  const [profileQuote, setProfileQuote] = useState('');
  const [pageColor, setPageColor] = useState('#4A9E8A');

  // ── Shared state ──
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── 2FA state ──
  type TwoFAStep = 'idle' | 'setup' | 'disabling';
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean | null>(null);
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>('idle');
  const [twoFAQr, setTwoFAQr] = useState('');
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  useEffect(() => {
    fetch('/api/teacher/2fa/status')
      .then((r) => r.ok ? r.json() : { totp_enabled: false })
      .then((d) => setTwoFAEnabled(d?.totp_enabled ?? false))
      .catch(() => setTwoFAEnabled(false));

    fetch('/api/teacher/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((d: { display_name?: string; email?: string; phone?: string; photo_url?: string; description?: string; bio?: string; show_photo?: boolean; show_description?: boolean; show_bio?: boolean; tutoring_area?: string; quote?: string; page_color?: string } | null) => {
        if (d) {
          setProfileName(d.display_name ?? '');
          setProfileEmail(d.email ?? '');
          setProfilePhone(d.phone ?? '');
          setProfilePhotoUrl(d.photo_url ?? '');
          setProfileDescription(d.description ?? '');
          setProfileBio(d.bio ?? '');
          setShowPhoto(d.show_photo ?? false);
          setShowDescription(d.show_description ?? false);
          setShowBio(d.show_bio ?? false);
          setTutoringArea(d.tutoring_area ?? '');
          setProfileQuote(d.quote ?? '');
          setPageColor(d.page_color ?? '#4A9E8A');
        }
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function startTwoFASetup() {
    setTwoFALoading(true);
    setTwoFAError('');
    const res = await fetch('/api/teacher/2fa/setup', { method: 'POST' });
    const data = await res.json();
    setTwoFALoading(false);
    if (!res.ok) { setTwoFAError(data.error || 'Setup failed'); return; }
    setTwoFAQr(data.qr);
    setTwoFASecret(data.secret);
    setTwoFACode('');
    setTwoFAStep('setup');
  }

  async function confirmTwoFAEnable() {
    if (!twoFACode) { setTwoFAError('Enter the 6-digit code'); return; }
    setTwoFALoading(true);
    setTwoFAError('');
    const res = await fetch('/api/teacher/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: twoFACode }),
    });
    const data = await res.json();
    setTwoFALoading(false);
    if (!res.ok) { setTwoFAError(data.error || 'Verification failed'); return; }
    setTwoFAEnabled(true);
    setTwoFAStep('idle');
    setTwoFACode('');
  }

  async function confirmTwoFADisable() {
    if (!twoFACode) { setTwoFAError('Enter the 6-digit code'); return; }
    setTwoFALoading(true);
    setTwoFAError('');
    const res = await fetch('/api/teacher/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: twoFACode }),
    });
    const data = await res.json();
    setTwoFALoading(false);
    if (!res.ok) { setTwoFAError(data.error || 'Verification failed'); return; }
    setTwoFAEnabled(false);
    setTwoFAStep('idle');
    setTwoFACode('');
  }

  function toggleChannel(key: NotificationKey, channel: keyof NotificationChannels) {
    setPrefs((p) => ({
      ...p,
      [key]: { ...p[key], [channel]: !p[key][channel] },
    }));
  }

  async function handleGeneralSave() {
    setSaving(true);
    setError('');
    const result = await onSave({
      default_duration_minutes: duration,
      time_format: timeFormat,
      notification_preferences: prefs,
      features,
    });
    setSaving(false);
    if ('error' in result) {
      setError((result as { error: string }).error);
    } else {
      onClose();
    }
  }

  async function handleProfileSave() {
    setSaving(true);
    setError('');

    // Upload photo first if one was selected
    if (photoFile) {
      const fd = new FormData();
      fd.append('photo', photoFile);
      const res = await fetch('/api/teacher/profile/photo', { method: 'POST', body: fd });
      if (res.ok) {
        const d = await res.json();
        setProfilePhotoUrl(d.photo_url);
        setPhotoFile(null);
        setPhotoPreview('');
      } else {
        const d = await res.json().catch(() => ({}));
        setSaving(false);
        setError(d.error || 'Photo upload failed');
        return;
      }
    }

    const res = await fetch('/api/teacher/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: profileName,
        phone: profilePhone,
        description: profileDescription,
        bio: profileBio,
        show_photo: showPhoto,
        show_description: showDescription,
        show_bio: showBio,
        tutoring_area: tutoringArea,
        quote: profileQuote,
        page_color: pageColor,
      }),
    });

    setSaving(false);
    if (res.ok) {
      onClose();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Failed to save profile');
    }
  }

  const currentPhotoSrc = photoPreview || profilePhotoUrl || '';

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={activeTab === 'profile' ? handleProfileSave : handleGeneralSave}
              disabled={saving}
              className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ms-1">&times;</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['general', 'profile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'general' ? 'General' : 'Profile'}
            </button>
          ))}
        </div>

        {/* ── GENERAL TAB ── */}
        {activeTab === 'general' && (
          <>
            {/* Default lesson duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default lesson duration</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={15}
                  max={180}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">minutes</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Used when creating new slots.</p>
            </div>

            {/* Time format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="timeFormat" value="24h" checked={timeFormat === '24h'} onChange={() => setTimeFormat('24h')} className="accent-blue-600" />
                  <span className="text-sm text-gray-700">24-hour <span className="text-gray-400">(14:30)</span></span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="timeFormat" value="12h" checked={timeFormat === '12h'} onChange={() => setTimeFormat('12h')} className="accent-blue-600" />
                  <span className="text-sm text-gray-700">12-hour <span className="text-gray-400">(2:30 PM)</span></span>
                </label>
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
              <p className="text-xs text-gray-400 mb-3">Hide features you don't need from the menu and student screen.</p>
              <div className="space-y-2">
                {([
                  { key: 'billing',            label: 'Billing',                      desc: 'Billing page in menu' },
                  { key: 'messages',           label: 'Messages',                     desc: 'Messages page in menu' },
                  { key: 'groups',             label: 'Groups',                       desc: 'Groups tab in student screen' },
                  { key: 'notebook',           label: 'Notebook',                     desc: 'Student notebook (tasks, notes, resources, grades)' },
                  { key: 'allow_cancellation', label: 'Student cancellation requests', desc: 'Students can request lesson cancellation' },
                ] as { key: keyof TeacherFeatures; label: string; desc: string }[]).map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!features[key]}
                      onChange={(e) => setFeatures((f) => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-sm text-gray-800">{label} <span className="text-xs text-gray-400">— {desc}</span></span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notification preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notifications</label>
              <p className="text-xs text-gray-400 mb-3">WhatsApp/push to student requires their phone or app install.</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_48px_64px_48px] bg-gray-50 px-3 py-2 border-b border-gray-200 gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center">Email</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center">WhatsApp</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center">Push</span>
                </div>
                {NOTIFICATION_ROWS.map((row, i) => (
                  <div
                    key={row.key}
                    className={`grid grid-cols-[1fr_48px_64px_48px] items-center px-3 py-2.5 gap-2 ${i < NOTIFICATION_ROWS.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div>
                      <span className="text-sm text-gray-800">{row.label}</span>
                      <span className="text-xs text-gray-400 ml-1.5">{row.direction}</span>
                    </div>
                    {(['email', 'whatsapp', 'push'] as const).map((ch) => (
                      <div key={ch} className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={prefs[row.key][ch]}
                          onChange={() => toggleChannel(row.key, ch)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                {twoFAEnabled === null ? (
                  <span className="text-xs text-gray-400">Loading…</span>
                ) : twoFAEnabled ? (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Enabled</span>
                ) : (
                  <span className="text-xs text-gray-400">Not enabled</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-3">Use Google Authenticator to require a one-time code at every login.</p>

              {twoFAStep === 'idle' && twoFAEnabled === false && (
                <button
                  type="button"
                  onClick={startTwoFASetup}
                  disabled={twoFALoading}
                  className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {twoFALoading ? 'Loading…' : 'Enable 2FA'}
                </button>
              )}

              {twoFAStep === 'idle' && twoFAEnabled === true && (
                <button
                  type="button"
                  onClick={() => { setTwoFAStep('disabling'); setTwoFACode(''); setTwoFAError(''); }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Disable 2FA
                </button>
              )}

              {twoFAStep === 'setup' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">
                    1. Open <strong>Google Authenticator</strong> and tap the <strong>+</strong> button.<br />
                    2. Choose <strong>Scan a QR code</strong> and point your camera at the image below.<br />
                    3. Enter the 6-digit code shown in the app.
                  </p>
                  {twoFAQr && (
                    <div className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={twoFAQr} alt="2FA QR code" className="w-44 h-44 border border-gray-200 rounded-lg p-1" />
                    </div>
                  )}
                  <details className="text-xs text-gray-400">
                    <summary className="cursor-pointer select-none">Can&apos;t scan? Enter key manually</summary>
                    <p className="mt-1 font-mono break-all select-all bg-gray-50 border border-gray-200 rounded p-2">{twoFASecret}</p>
                  </details>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={confirmTwoFAEnable}
                      disabled={twoFALoading || twoFACode.length < 6}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {twoFALoading ? 'Verifying…' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTwoFAStep('idle'); setTwoFAError(''); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {twoFAStep === 'disabling' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">Enter your current authenticator code to confirm disabling 2FA.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={confirmTwoFADisable}
                      disabled={twoFALoading || twoFACode.length < 6}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {twoFALoading ? 'Verifying…' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTwoFAStep('idle'); setTwoFAError(''); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {twoFAError && <p className="text-xs text-red-600 mt-1">{twoFAError}</p>}
            </div>
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            {profileLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
            ) : (
              <>
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tutoring area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area of tutoring</label>
                  <input
                    type="text"
                    value={tutoringArea}
                    onChange={(e) => setTutoringArea(e.target.value)}
                    placeholder="e.g. English, Piano, Math, Literature…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown below your name on the student login page.</p>
                </div>

                {/* Quote */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quote</label>
                  <textarea
                    rows={2}
                    value={profileQuote}
                    onChange={(e) => setProfileQuote(e.target.value)}
                    placeholder="A short inspiring quote shown on your login page…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Photo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Photo</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500">Show on page</span>
                      <input
                        type="checkbox"
                        checked={showPhoto}
                        onChange={(e) => setShowPhoto(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    {currentPhotoSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentPhotoSrc}
                        alt="Profile photo"
                        className="w-16 h-16 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {currentPhotoSrc ? 'Change photo' : 'Upload photo'}
                      </button>
                      {currentPhotoSrc && (
                        <button
                          type="button"
                          onClick={() => { setPhotoFile(null); setPhotoPreview(''); setProfilePhotoUrl(''); }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                      <p className="text-xs text-gray-400">JPEG, PNG or WebP · max 5 MB</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500">Show on page</span>
                      <input
                        type="checkbox"
                        checked={showDescription}
                        onChange={(e) => setShowDescription(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={profileDescription}
                    onChange={(e) => setProfileDescription(e.target.value)}
                    placeholder="A short tagline or intro (e.g. Piano teacher · 10 years experience)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Bio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Bio</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500">Show on page</span>
                      <input
                        type="checkbox"
                        checked={showBio}
                        onChange={(e) => setShowBio(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Tell students more about yourself, your teaching style, background…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Page color */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page color</label>
                  <p className="text-xs text-gray-400 mb-3">Used for your avatar and button on the student login page.</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { label: 'Teal',    value: '#4A9E8A' },
                      { label: 'Forest',  value: '#2D6A4F' },
                      { label: 'Blue',    value: '#2563EB' },
                      { label: 'Indigo',  value: '#4F46E5' },
                      { label: 'Purple',  value: '#7C3AED' },
                      { label: 'Rose',    value: '#E11D48' },
                      { label: 'Amber',   value: '#D97706' },
                      { label: 'Slate',   value: '#475569' },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        title={label}
                        onClick={() => setPageColor(value)}
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                        style={{
                          backgroundColor: value,
                          borderColor: pageColor === value ? '#1f2937' : 'transparent',
                        }}
                      >
                        {pageColor === value && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                    {/* Custom color */}
                    <button
                      type="button"
                      title="Custom color"
                      onClick={() => colorInputRef.current?.click()}
                      className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center transition-colors"
                      style={
                        !['#4A9E8A','#2D6A4F','#2563EB','#4F46E5','#7C3AED','#E11D48','#D97706','#475569'].includes(pageColor)
                          ? { backgroundColor: pageColor, borderColor: '#1f2937', borderStyle: 'solid' }
                          : {}
                      }
                    >
                      {['#4A9E8A','#2D6A4F','#2563EB','#4F46E5','#7C3AED','#E11D48','#D97706','#475569'].includes(pageColor) && (
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </button>
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={pageColor}
                      onChange={(e) => setPageColor(e.target.value)}
                      className="sr-only"
                    />
                  </div>
                  {/* Preview */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Preview</p>
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-gray-100">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: `${pageColor}22`, color: pageColor }}
                      >
                        RW
                      </div>
                      <div
                        className="flex-1 text-center text-xs font-semibold text-white rounded-lg py-1.5 pointer-events-none select-none"
                        style={{ backgroundColor: pageColor }}
                      >
                        Continue
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
