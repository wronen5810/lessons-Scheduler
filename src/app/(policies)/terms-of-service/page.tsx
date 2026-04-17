import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service – Lessons Scheduler',
};

export default function TermsOfServicePage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">
        <strong>Effective Date:</strong> April 17, 2026 &nbsp;·&nbsp; <strong>Last Updated:</strong> April 17, 2026
      </p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of the Lessons Scheduler web application and
        related services (the "Service") provided by Ronen Wolfsberger ("we," "us," or "our").
      </p>
      <p className="mt-3">
        By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the
        Service.
      </p>

      <hr className="my-8 border-gray-200" />

      <Section n="1" title="Eligibility">
        <p>
          You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account and enter
          into these Terms. If you use the Service on behalf of an organization, you represent that you are authorized to
          bind it to these Terms.
        </p>
      </Section>

      <Section n="2" title="Account Registration">
        <p>
          You agree to provide accurate, current, and complete information during registration and to keep it updated.
          You are responsible for safeguarding your account credentials and for all activity under your account. Notify
          us immediately at <SupportEmail /> if you suspect unauthorized access.
        </p>
      </Section>

      <Section n="3" title="The Service">
        <p>
          Lessons Scheduler is a web application that helps teachers schedule, manage, and track lessons, sessions, and
          appointments with their students. Specific features may change over time. We may add, modify, or remove
          features at our discretion.
        </p>
      </Section>

      <Section n="4" title="Subscriptions and Payments">
        <SubSection title="4.1 Subscription Plans">
          The Service offers paid subscription plans. Plan details — including price, billing cycle, included features,
          and any free trial — are disclosed at the point of purchase.
        </SubSection>
        <SubSection title="4.2 Billing">
          <ul className="list-disc list-inside space-y-1">
            <li>Subscriptions are billed through Google Play Billing on Android or Stripe for direct purchases.</li>
            <li>By subscribing, you authorize us (or the billing provider) to charge the applicable fees to your selected payment method on each renewal.</li>
            <li>Prices are shown inclusive of or exclusive of taxes as required by local law. You are responsible for any applicable taxes.</li>
          </ul>
        </SubSection>
        <SubSection title="4.3 Auto-Renewal">
          <ul className="list-disc list-inside space-y-1">
            <li>Subscriptions automatically renew at the end of each billing period at the then-current rate until cancelled.</li>
            <li>You will be charged no earlier than 24 hours before the start of each new billing period.</li>
            <li>To avoid renewal, cancel at least 24 hours before the current period ends.</li>
          </ul>
        </SubSection>
        <SubSection title="4.4 Free Trials">
          If a free trial is offered, it converts to a paid subscription at the end of the trial unless cancelled before
          the trial ends. Only one free trial is available per user.
        </SubSection>
        <SubSection title="4.5 Price Changes">
          We may change subscription prices. Where required, we will notify you in advance and give you the opportunity
          to cancel before the new price takes effect. Continued use after the effective date constitutes acceptance of
          the new price.
        </SubSection>
        <SubSection title="4.6 Cancellation">
          <p>You can cancel at any time:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Google Play subscriptions:</strong> Google Play app → Subscriptions → Lessons Scheduler → Cancel.</li>
            <li><strong>Direct subscriptions:</strong> in-app Settings → Subscription → Cancel, or by contacting <SupportEmail />.</li>
          </ul>
          <p className="mt-2">Cancellation stops future renewals. You retain access through the end of the current paid period.</p>
        </SubSection>
        <SubSection title="4.7 Refunds">
          See our{' '}
          <a href="https://refundpolicy.lessons-scheduler.com" className="text-blue-600 hover:underline">
            Refund Policy
          </a>{' '}
          for details. Purchases made through Google Play are subject to Google Play's refund policy.
        </SubSection>
      </Section>

      <Section n="5" title="Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Use the Service for unlawful purposes or in violation of these Terms.</li>
          <li>Upload or share content that is infringing, defamatory, harassing, harmful, or otherwise objectionable.</li>
          <li>Attempt to reverse-engineer, decompile, or bypass security measures of the Service.</li>
          <li>Interfere with or disrupt the Service or servers.</li>
          <li>Use automated means (bots, scrapers) to access the Service without our written consent.</li>
          <li>Resell, sublicense, or commercially exploit the Service without authorization.</li>
          <li>Use the Service to spam, phish, or transmit malware.</li>
        </ul>
        <p className="mt-3">We may suspend or terminate accounts that violate these rules.</p>
      </Section>

      <Section n="6" title="User Content">
        <p>
          You retain ownership of content you submit to the Service (e.g., lesson notes, student lists, schedules —
          "User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to
          host, store, reproduce, and display it solely to operate and provide the Service to you.
        </p>
        <p className="mt-3">
          You are responsible for your User Content, including ensuring that you have the right to submit it and that it
          does not violate any law or third-party right.
        </p>
      </Section>

      <Section n="7" title="Intellectual Property">
        <p>
          The Service, including its software, design, logos, trademarks, and content provided by us, is owned by Ronen
          Wolfsberger or our licensors and is protected by intellectual property laws. We grant you a limited,
          non-exclusive, non-transferable, revocable license to use the Service for personal or internal business use,
          subject to these Terms.
        </p>
      </Section>

      <Section n="8" title="Third-Party Services">
        <p>
          The Service may integrate with third-party services (e.g., Google Calendar, payment processors). Use of
          third-party services is governed by their own terms. We are not responsible for third-party services.
        </p>
      </Section>

      <Section n="9" title="Termination">
        <p>
          You may stop using the Service and delete your account at any time. We may suspend or terminate your access if
          you violate these Terms, if required by law, or to protect the Service or other users.
        </p>
        <p className="mt-3">On termination:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Your right to use the Service ends immediately.</li>
          <li>Sections that by their nature should survive (e.g., IP, disclaimers, liability) will survive.</li>
          <li>Prepaid fees are non-refundable except as required by law or our Refund Policy.</li>
        </ul>
      </Section>

      <Section n="10" title="Disclaimers">
        <p className="uppercase text-sm leading-relaxed">
          The Service is provided "as is" and "as available" without warranties of any kind, express or implied,
          including warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted
          or error-free operation. We do not guarantee that the Service will meet your requirements or that data will
          never be lost.
        </p>
        <p className="mt-3 text-sm">
          Some jurisdictions do not allow the exclusion of implied warranties, so some of the above may not apply to you.
        </p>
      </Section>

      <Section n="11" title="Limitation of Liability">
        <p className="uppercase text-sm leading-relaxed">
          To the maximum extent permitted by law, Ronen Wolfsberger and its affiliates will not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or
          goodwill, arising out of or related to your use of the Service.
        </p>
        <p className="mt-3 uppercase text-sm leading-relaxed">
          Our total liability for any claim relating to the Service will not exceed the greater of (a) the amounts you
          paid us in the 12 months before the claim, or (b) USD $100.
        </p>
        <p className="mt-3 text-sm">Nothing in these Terms limits liability that cannot be limited under applicable law.</p>
      </Section>

      <Section n="12" title="Indemnification">
        <p>
          You agree to indemnify and hold Ronen Wolfsberger harmless from any claims, damages, losses, and expenses
          (including reasonable legal fees) arising from your User Content, your use of the Service, or your violation
          of these Terms or applicable law.
        </p>
      </Section>

      <Section n="13" title="Changes to the Terms">
        <p>
          We may update these Terms from time to time. If changes are material, we will notify you in-app or by email at
          least 14 days before they take effect. Continued use of the Service after changes take effect constitutes
          acceptance.
        </p>
      </Section>

      <Section n="14" title="Governing Law and Disputes">
        <p>
          These Terms are governed by the laws of Israel, without regard to conflict-of-laws principles. Disputes will
          be resolved in the competent courts of Israel, unless applicable consumer-protection law grants you the right
          to sue in your home jurisdiction.
        </p>
      </Section>

      <Section n="15" title="Miscellaneous">
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Entire Agreement:</strong> these Terms, together with our Privacy Policy and Refund Policy, form the entire agreement between you and us regarding the Service.</li>
          <li><strong>Severability:</strong> if any provision is unenforceable, the remaining provisions stay in effect.</li>
          <li><strong>No Waiver:</strong> our failure to enforce a provision is not a waiver of it.</li>
          <li><strong>Assignment:</strong> you may not assign these Terms without our consent. We may assign them as part of a merger, acquisition, or sale of assets.</li>
        </ul>
      </Section>

      <Section n="16" title="Contact">
        <address className="not-italic text-gray-700 space-y-1">
          <p><strong>Ronen Wolfsberger</strong></p>
          <p>Support: <SupportEmail /></p>
          <p>Legal: <SupportEmail /></p>
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

function SupportEmail() {
  return (
    <a href="mailto:support@lessons-scheduler.com" className="text-blue-600 hover:underline">
      support@lessons-scheduler.com
    </a>
  );
}
