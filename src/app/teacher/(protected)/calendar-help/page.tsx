'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Platform = 'google-web' | 'google-android' | 'apple-iphone' | 'apple-mac' | 'outlook';

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: 'google-web',     label: 'Google Calendar (web)',    icon: '🌐' },
  { id: 'google-android', label: 'Google Calendar (Android)', icon: '🤖' },
  { id: 'apple-iphone',  label: 'Apple Calendar (iPhone)',   icon: '📱' },
  { id: 'apple-mac',     label: 'Apple Calendar (Mac)',      icon: '💻' },
  { id: 'outlook',       label: 'Outlook',                   icon: '📧' },
];

interface Step { text: string; sub?: string }

const STEPS: Record<Platform, Step[]> = {
  'google-web': [
    { text: 'Go to calendar.google.com in your browser.' },
    { text: 'In the left sidebar, find "Other calendars" and click the + button next to it.' },
    { text: 'Choose "From URL" from the menu.' },
    { text: 'Paste your calendar URL into the field.' },
    { text: 'Click "Add calendar".' },
    { text: 'A new calendar called "Lessons" appears. Your lessons will show up within a few minutes.', sub: 'Google refreshes the feed roughly every 12–24 hours after the initial sync.' },
  ],
  'google-android': [
    { text: 'Calendar subscriptions must be added on the web first (Google doesn\'t support adding ICS feeds directly in the Android app).' },
    { text: 'Follow the "Google Calendar (web)" steps above using a browser.' },
    { text: 'Open the Google Calendar app on your Android device.' },
    { text: 'Tap the menu (☰), scroll to the bottom and tap "Settings".' },
    { text: 'Tap "Manage accounts" and make sure your Google account is enabled for sync.' },
    { text: 'The "Lessons" calendar will appear automatically once the web subscription is active.', sub: 'Pull down to refresh if it doesn\'t appear immediately.' },
  ],
  'apple-iphone': [
    { text: 'Open the Settings app (the grey gear icon).' },
    { text: 'Scroll down and tap "Calendar".' },
    { text: 'Tap "Accounts", then tap "Add Account".' },
    { text: 'Tap "Other" at the bottom of the list.' },
    { text: 'Tap "Add Subscribed Calendar".' },
    { text: 'Paste your calendar URL into the "Server" field and tap "Next".' },
    { text: 'Optionally change the calendar name, then tap "Save".' },
    { text: 'Open the Calendar app — your lessons appear immediately.', sub: 'Apple Calendar refreshes subscribed calendars every hour by default.' },
  ],
  'apple-mac': [
    { text: 'Open the Calendar app.' },
    { text: 'From the menu bar choose File → "New Calendar Subscription…".' },
    { text: 'Paste your calendar URL and click "Subscribe".' },
    { text: 'Set a name (e.g. "Lessons") and choose a refresh frequency — "Every Hour" is recommended.' },
    { text: 'Click "OK".' },
    { text: 'Your lessons appear in Calendar immediately.', sub: 'To change the refresh rate later, right-click the calendar in the sidebar and choose "Get Info".' },
  ],
  'outlook': [
    { text: 'Go to outlook.com and sign in.' },
    { text: 'Click the calendar grid icon in the left navigation bar.' },
    { text: 'Click "Add calendar" in the left panel.' },
    { text: 'Select "Subscribe from web".' },
    { text: 'Paste your calendar URL into the "Enter the URL of the calendar you want to subscribe to" field.' },
    { text: 'Give the calendar a name (e.g. "Lessons") and click "Import".' },
    { text: 'Your lessons appear in Outlook Calendar.', sub: 'Outlook for web refreshes subscribed calendars every few hours.' },
  ],
};

function Step({ num, text, sub }: { num: number; text: string; sub?: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {num}
      </div>
      <div>
        <p className="text-sm text-gray-800">{text}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function CalendarHelpPage() {
  const [active, setActive] = useState<Platform>('google-web');
  const [calUrl, setCalUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/teacher/calendar-token')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.url) setCalUrl(d.url); })
      .catch(() => {});
  }, []);

  function copy() {
    if (!calUrl) return;
    navigator.clipboard.writeText(calUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link href="/teacher/settings" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Back
        </Link>
        <h1 className="text-base font-semibold text-gray-900">Adding Lessons to Your Calendar</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Intro */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-2">
          <h2 className="text-sm font-semibold text-gray-900">How it works</h2>
          <p className="text-sm text-gray-600">
            Your lesson schedule is available as a calendar feed (ICS format) that any calendar
            app can subscribe to. Once subscribed, new lessons, reschedules, and cancellations
            appear in your calendar automatically — no manual updates needed.
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 pt-1">
            <li>Read-only — changes in the calendar app don't affect the app</li>
            <li>Shows lessons 60 days back and 6 months forward</li>
            <li>Cancelled lessons appear as crossed-out events</li>
            <li>Works with Google, Apple, Outlook and any ICS-compatible app</li>
          </ul>
        </div>

        {/* Calendar URL */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Your calendar URL</h2>
          <p className="text-xs text-gray-400 mb-3">
            You'll need this URL when following the steps below.
            Keep it private — it gives read access to your full schedule.
          </p>
          {calUrl ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={calUrl}
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50 font-mono truncate focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={copy}
                className="flex-shrink-0 text-sm px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-amber-600 text-sm">⚠</span>
              <p className="text-sm text-amber-700">
                No calendar link yet.{' '}
                <Link href="/teacher/settings" className="font-medium underline">
                  Open Settings → General → Calendar Sync
                </Link>{' '}
                to generate one.
              </p>
            </div>
          )}
        </div>

        {/* Platform picker */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Step-by-step instructions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Choose your calendar app below.</p>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 px-4 gap-0.5 pt-2 bg-white">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active === p.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          {/* Steps */}
          <div className="p-5 space-y-4">
            {STEPS[active].map((s, i) => (
              <Step key={i} num={i + 1} text={s.text} sub={s.sub} />
            ))}
          </div>
        </div>

        {/* Refresh frequency note */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Refresh frequency</h2>
          <p className="text-sm text-gray-600">
            Calendar apps check the feed on their own schedule — you can't force an instant update.
            Typical intervals:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { app: 'Google Calendar', freq: '12–24 hours' },
              { app: 'Apple Calendar', freq: '~1 hour' },
              { app: 'Outlook (web)', freq: '3–4 hours' },
              { app: 'Outlook (desktop)', freq: 'Manual or daily' },
            ].map((r) => (
              <div key={r.app} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-600 font-medium">{r.app}</span>
                <span className="text-gray-400">{r.freq}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            For the freshest data, check the app directly. The calendar is best used as a
            convenient overview, not a real-time feed.
          </p>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">FAQ</h2>

          {[
            {
              q: 'What if I share my URL by accident?',
              a: 'Go to Settings → General → Calendar Sync and click "Regenerate". The old URL stops working immediately. Paste the new URL into your calendar app to resubscribe.',
            },
            {
              q: 'Will pending (unconfirmed) lesson requests show up?',
              a: 'Yes — pending and approved lessons both appear in the feed. Cancelled lessons show as cancelled events. Rejected requests are excluded.',
            },
            {
              q: 'Can students subscribe to their own calendar?',
              a: 'Not yet. The calendar feed currently covers the full teacher schedule. Per-student feeds may be added in a future update.',
            },
            {
              q: 'Why don\'t I see lessons I just added?',
              a: 'The calendar app hasn\'t refreshed yet. Wait for the next automatic refresh (see table above), or remove and re-add the subscription to trigger an immediate fetch.',
            },
            {
              q: 'The calendar appears empty in my app.',
              a: 'Make sure you\'ve generated a calendar link in Settings → General → Calendar Sync first. Also check that your date range includes upcoming lessons (the feed shows 60 days back to 6 months forward).',
            },
          ].map((item) => (
            <div key={item.q} className="space-y-1">
              <p className="text-sm font-medium text-gray-800">{item.q}</p>
              <p className="text-sm text-gray-500">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="pb-8">
          <Link
            href="/teacher/settings"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Settings
          </Link>
        </div>
      </main>
    </div>
  );
}
