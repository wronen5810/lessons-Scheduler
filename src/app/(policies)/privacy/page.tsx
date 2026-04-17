import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – Lessons Scheduler',
};

const EFFECTIVE_DATE = 'April 17, 2026';
const SUPPORT_EMAIL = 'Support@lessons-scheduler.com';

function Email() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">
      {SUPPORT_EMAIL}
    </a>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-700 leading-relaxed mb-3">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">{children}</ul>;
}

export default function PrivacyPolicyPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-1"><strong>Effective Date:</strong> {EFFECTIVE_DATE}</p>
      <p className="text-sm text-gray-500 mb-8"><strong>Last Updated:</strong> {EFFECTIVE_DATE}</p>

      <P>
        This Privacy Policy describes how Ronen Wolfsberger ("we," "us," or "our") collects, uses, and shares
        information when you use the Lessons Scheduler application and related services (collectively, the "Service").
      </P>
      <P>
        By using the Service, you agree to this Privacy Policy. If you do not agree, do not use the Service.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>1. Information We Collect</H2>

      <H3>1.1 Information You Provide</H3>
      <UL>
        <li><strong>Account information:</strong> name, email address, phone number (optional).</li>
        <li><strong>Scheduling data:</strong> lessons, students/teachers, dates, times, notes, and related entries you create.</li>
        <li><strong>Payment information:</strong> payment is processed by Google Play Billing or Stripe. We do not store your full card number. We receive limited transaction data (e.g., subscription status, last 4 digits, billing country).</li>
        <li><strong>Communications:</strong> messages you send to us through support channels.</li>
      </UL>

      <H3>1.2 Information Collected Automatically</H3>
      <UL>
        <li><strong>Device and usage data:</strong> device model, operating system, app version, language, crash logs, IP address, approximate location (country/region), and in-app actions.</li>
        <li><strong>Identifiers:</strong> an app-generated user ID and, where permitted, device identifiers.</li>
        <li><strong>Cookies and similar technologies:</strong> used for authentication and preferences.</li>
      </UL>

      <H3>1.3 Information from Third Parties</H3>
      <UL>
        <li><strong>Sign-in providers:</strong> if you sign in with Google or via magic link, we receive your name, email, and profile image.</li>
        <li><strong>Calendar integrations:</strong> if you connect Google Calendar or another calendar service, we access event data you explicitly share.</li>
      </UL>

      <hr className="my-8 border-gray-200" />

      <H2>2. How We Use Information</H2>
      <P>We use information to:</P>
      <UL>
        <li>Provide, maintain, and improve the Service (scheduling, reminders, account management).</li>
        <li>Process subscriptions, renewals, refunds, and related billing.</li>
        <li>Send service-related notifications (e.g., lesson reminders, billing receipts, policy updates).</li>
        <li>Respond to support requests.</li>
        <li>Detect, prevent, and address fraud, abuse, and security issues.</li>
        <li>Analyze usage to improve performance and features (in aggregated or pseudonymized form).</li>
        <li>Comply with legal obligations.</li>
      </UL>
      <P>
        We do <strong>not</strong> sell your personal information. We do <strong>not</strong> use your scheduling
        data or lesson content for advertising.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>3. Legal Bases (GDPR)</H2>
      <P>
        If you are in the European Economic Area, UK, or Switzerland, we process personal data on these legal bases:
      </P>
      <UL>
        <li><strong>Contract:</strong> to provide the Service you signed up for.</li>
        <li><strong>Legitimate interests:</strong> to secure, improve, and analyze the Service.</li>
        <li><strong>Consent:</strong> for optional features (e.g., marketing emails, analytics where required).</li>
        <li><strong>Legal obligation:</strong> tax, accounting, and regulatory compliance.</li>
      </UL>

      <hr className="my-8 border-gray-200" />

      <H2>4. How We Share Information</H2>
      <P>We share information only as described below:</P>
      <UL>
        <li><strong>Service providers (processors):</strong> cloud hosting (Supabase/Firebase), email delivery (Resend), payment processing (Google Play, Stripe). These providers act on our instructions and are bound by confidentiality.</li>
        <li><strong>Payment platforms:</strong> Google Play Billing and Stripe process payments directly and apply their own privacy policies.</li>
        <li><strong>Legal and safety:</strong> when required by law, subpoena, or to protect rights, safety, or property.</li>
        <li><strong>Business transfers:</strong> if we are acquired or merged, information may transfer to the new entity, subject to this policy.</li>
        <li><strong>With your consent:</strong> for any other sharing you explicitly approve.</li>
      </UL>

      <hr className="my-8 border-gray-200" />

      <H2>5. International Data Transfers</H2>
      <P>
        Information may be processed in countries other than your own, including the United States and the European
        Union. Where required, we use appropriate safeguards (e.g., Standard Contractual Clauses) to protect data
        transferred outside the EEA/UK.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>6. Data Retention</H2>
      <P>
        We retain information for as long as your account is active and as needed to provide the Service. After account
        deletion:
      </P>
      <UL>
        <li>Account and scheduling data are deleted within 30 days.</li>
        <li>Backups are purged within 90 days.</li>
        <li>Billing records may be retained longer where required by tax, accounting, or legal obligations.</li>
      </UL>

      <hr className="my-8 border-gray-200" />

      <H2>7. Your Rights</H2>
      <P>Depending on your location, you may have the right to:</P>
      <UL>
        <li>Access, correct, or delete your personal data.</li>
        <li>Export your data in a portable format.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Withdraw consent at any time.</li>
        <li>Lodge a complaint with a data protection authority.</li>
      </UL>
      <P>
        <strong>California residents (CCPA/CPRA):</strong> you have the right to know, delete, correct, and opt out
        of "sales" or "sharing" of personal information. We do not sell or share your personal information as those
        terms are defined under California law.
      </P>
      <P>To exercise your rights, contact us at <Email />.</P>

      <hr className="my-8 border-gray-200" />

      <H2>8. Account Deletion</H2>
      <P>You can delete your account at any time:</P>
      <UL>
        <li><strong>In-app:</strong> Settings → Account → Delete Account.</li>
        <li><strong>On the web:</strong> lessons-scheduler.com/delete-account</li>
        <li><strong>By email:</strong> <Email /></li>
      </UL>
      <P>
        Deleting your account removes your profile, scheduling data, and associated content, subject to the retention
        periods in Section 6. Subscription cancellation must be done separately via Google Play or the applicable
        billing provider.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>9. Children's Privacy</H2>
      <P>
        The Service is not directed to children under 13. We do not knowingly collect personal information from
        children. If you believe a child has provided us information, contact <Email /> and we will delete it.
      </P>
      <P>
        If the Service is used to schedule lessons for a minor, the minor's parent or legal guardian must hold the
        account and provide any personal information about the minor.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>10. Security</H2>
      <P>
        We use reasonable technical and organizational measures to protect information, including encryption in transit
        (TLS), encryption at rest, access controls, and routine security reviews. No method is 100% secure; we cannot
        guarantee absolute security.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>11. Third-Party Services</H2>
      <P>
        The Service may contain links to or integrate with third-party services (e.g., Google Calendar, video meeting
        platforms). Their privacy practices are governed by their own policies, which we encourage you to review.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>12. Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. If changes are material, we will notify you in-app or by
        email before they take effect. The "Last Updated" date at the top reflects the latest revision.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>13. Contact Us</H2>
      <P>For privacy questions, requests, or complaints:</P>
      <address className="not-italic text-gray-700 space-y-1 leading-relaxed">
        <p><strong>Ronen Wolfsberger</strong></p>
        <p>20 Hazabar St., Kadima, Israel</p>
        <p>Email: <Email /></p>
        <p>
          Website:{' '}
          <a href="https://lessons-scheduler.com" className="text-blue-600 hover:underline">
            lessons-scheduler.com
          </a>
        </p>
      </address>
    </article>
  );
}
