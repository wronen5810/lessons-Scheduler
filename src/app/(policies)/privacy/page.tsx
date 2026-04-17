import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – Lessons Scheduler',
};

export default function PrivacyPolicyPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">
        <strong>Effective Date:</strong> April 17, 2026 &nbsp;·&nbsp; <strong>Last Updated:</strong> April 17, 2026
      </p>

      <p>
        This Privacy Policy describes how Ronen Wolfsberger ("we," "us," or "our") collects, uses, and shares
        information when you use the Lessons Scheduler web application and related services (collectively, the
        "Service").
      </p>
      <p className="mt-3">
        By using the Service, you agree to this Privacy Policy. If you do not agree, do not use the Service.
      </p>

      <hr className="my-8 border-gray-200" />

      <Section n="1" title="Information We Collect">
        <SubSection title="1.1 Information You Provide">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Account information:</strong> name, email address, phone number (optional).</li>
            <li><strong>Scheduling data:</strong> lessons, student lists, dates, times, notes, and related entries you create.</li>
            <li><strong>Payment information:</strong> payments are processed by Google Play Billing or Stripe. We do not store your full card number. We receive limited transaction data (e.g., subscription status, billing country).</li>
            <li><strong>Communications:</strong> messages you send to us through support channels.</li>
          </ul>
        </SubSection>
        <SubSection title="1.2 Information Collected Automatically">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Device and usage data:</strong> device model, operating system, browser, IP address, approximate location (country/region), and in-app actions.</li>
            <li><strong>Identifiers:</strong> an app-generated user ID linked to your email address.</li>
            <li><strong>Cookies and similar technologies:</strong> used for authentication and session management.</li>
          </ul>
        </SubSection>
        <SubSection title="1.3 Information from Third Parties">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Sign-in providers:</strong> if you sign in with Google or email magic link, we receive your email address and name.</li>
            <li><strong>Push notification tokens:</strong> if you enable push notifications, a device token is stored to deliver notifications.</li>
          </ul>
        </SubSection>
      </Section>

      <Section n="2" title="How We Use Information">
        <p>We use information to:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Provide, maintain, and improve the Service (scheduling, reminders, account management).</li>
          <li>Process subscriptions, renewals, refunds, and related billing.</li>
          <li>Send service-related notifications (e.g., lesson reminders, billing receipts, policy updates).</li>
          <li>Respond to support requests.</li>
          <li>Detect, prevent, and address fraud, abuse, and security issues.</li>
          <li>Analyze usage to improve performance and features (in aggregated or pseudonymized form).</li>
          <li>Comply with legal obligations.</li>
        </ul>
        <p className="mt-3 font-medium">
          We do <em>not</em> sell your personal information. We do <em>not</em> use your scheduling data or lesson
          content for advertising.
        </p>
      </Section>

      <Section n="3" title="Legal Bases (GDPR)">
        <p>
          If you are in the European Economic Area, UK, or Switzerland, we process personal data on these legal bases:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Contract:</strong> to provide the Service you signed up for.</li>
          <li><strong>Legitimate interests:</strong> to secure, improve, and analyze the Service.</li>
          <li><strong>Consent:</strong> for optional features (e.g., push notifications, marketing emails where required).</li>
          <li><strong>Legal obligation:</strong> tax, accounting, and regulatory compliance.</li>
        </ul>
      </Section>

      <Section n="4" title="How We Share Information">
        <p>We share information only as described below:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Service providers (processors):</strong> cloud hosting (Supabase/PostgreSQL), email delivery (Resend), push notifications (Firebase), and payment processing (Google Play, Stripe). These providers act on our instructions and are bound by confidentiality.</li>
          <li><strong>Payment platforms:</strong> Google Play Billing and Stripe process payments directly and apply their own privacy policies.</li>
          <li><strong>Legal and safety:</strong> when required by law, subpoena, or to protect rights, safety, or property.</li>
          <li><strong>Business transfers:</strong> if we are acquired or merged, information may transfer to the new entity, subject to this policy.</li>
          <li><strong>With your consent:</strong> for any other sharing you explicitly approve.</li>
        </ul>
      </Section>

      <Section n="5" title="International Data Transfers">
        <p>
          Information may be processed in countries other than your own, including the United States and the European
          Union. Where required, we use appropriate safeguards (e.g., Standard Contractual Clauses) to protect data
          transferred outside the EEA/UK.
        </p>
      </Section>

      <Section n="6" title="Data Retention">
        <p>
          We retain information for as long as your account is active and as needed to provide the Service. After account
          deletion:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Account and scheduling data are deleted within 30 days.</li>
          <li>Backups are purged within 90 days.</li>
          <li>Billing records may be retained longer where required by tax, accounting, or legal obligations.</li>
        </ul>
      </Section>

      <Section n="7" title="Your Rights">
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Access, correct, or delete your personal data.</li>
          <li>Export your data in a portable format.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent at any time.</li>
          <li>Lodge a complaint with a data protection authority.</li>
        </ul>
        <p className="mt-3">
          <strong>California residents (CCPA/CPRA):</strong> you have the right to know, delete, correct, and opt out
          of "sales" or "sharing" of personal information. We do not sell or share your personal information as those
          terms are defined under California law.
        </p>
        <p className="mt-3">
          To exercise your rights, contact us at <PrivacyEmail />.
        </p>
      </Section>

      <Section n="8" title="Account Deletion">
        <p>You can delete your account at any time by contacting <PrivacyEmail />.</p>
        <p className="mt-2">
          Deleting your account removes your profile, scheduling data, and associated content, subject to the retention
          periods in Section 6. Subscription cancellation must be done separately via Google Play or the applicable
          billing provider.
        </p>
      </Section>

      <Section n="9" title="Children's Privacy">
        <p>
          The Service is not directed to children under 13. We do not knowingly collect personal information from
          children. If you believe a child has provided us information, contact <PrivacyEmail /> and we will delete it.
        </p>
        <p className="mt-3">
          If the Service is used to schedule lessons for a minor, the minor's parent or legal guardian must hold the
          account and provide any personal information about the minor.
        </p>
      </Section>

      <Section n="10" title="Security">
        <p>
          We use reasonable technical and organizational measures to protect information, including encryption in transit
          (TLS), encryption at rest, access controls, and routine security reviews. No method is 100% secure; we cannot
          guarantee absolute security.
        </p>
      </Section>

      <Section n="11" title="Third-Party Services">
        <p>
          The Service may integrate with third-party services (e.g., WhatsApp via deep links, video meeting platforms).
          Their privacy practices are governed by their own policies, which we encourage you to review.
        </p>
      </Section>

      <Section n="12" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. If changes are material, we will notify you in-app or by
          email before they take effect. The "Last Updated" date at the top reflects the latest revision.
        </p>
      </Section>

      <Section n="13" title="Contact Us">
        <p>For privacy questions, requests, or complaints:</p>
        <address className="not-italic text-gray-700 space-y-1 mt-3">
          <p><strong>Ronen Wolfsberger</strong></p>
          <p>Email: <PrivacyEmail /></p>
          <p>Website: <a href="https://lessons-scheduler.com" className="text-blue-600 hover:underline">lessons-scheduler.com</a></p>
        </address>
      </Section>
    </article>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{n}. {title}</h2>
      <div className="text-gray-700 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );
}

function PrivacyEmail() {
  return (
    <a href="mailto:privacy@lessons-scheduler.com" className="text-blue-600 hover:underline">
      privacy@lessons-scheduler.com
    </a>
  );
}
