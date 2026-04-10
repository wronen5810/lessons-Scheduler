'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-6 block">← Back</Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-xs text-gray-400 mb-8">Last updated: April 2026</p>

        <div className="prose prose-sm text-gray-700 space-y-6">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. What information we collect</h2>
            <p>
              We collect the following personal information when you register or use this service:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Name and email address</li>
              <li>Phone number (optional)</li>
              <li>Lesson scheduling information (dates, times, booking status)</li>
              <li>Homework, notes, and resources added by your teacher</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. How we use your information</h2>
            <p>Your information is used solely to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Enable lesson scheduling and management between you and your teacher</li>
              <li>Send you lesson confirmations and reminders by email</li>
              <li>Maintain your lesson notebook</li>
            </ul>
            <p className="mt-2">We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Data storage</h2>
            <p>
              Your data is stored securely using Supabase (hosted on AWS). Email communications are sent
              via Resend. Both services comply with industry-standard security practices.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Data retention</h2>
            <p>
              Your data is retained for as long as you are an active student. You may request deletion of
              your data at any time by contacting your teacher.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Your rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact your teacher directly.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Cookies</h2>
            <p>
              This site does not use tracking or advertising cookies. Session state is managed
              via URL parameters only.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Contact</h2>
            <p>
              If you have any questions about this privacy policy, please contact your teacher.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
