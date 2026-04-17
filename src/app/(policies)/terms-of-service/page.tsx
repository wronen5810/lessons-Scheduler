import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service – Lessons Scheduler',
};

const EFFECTIVE_DATE = 'April 17, 2026';
const SUPPORT_EMAIL = 'support@lessons-scheduler.com';

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

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-gray-700 leading-relaxed mb-3 ${className ?? ''}`}>{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">{children}</ul>;
}

export default function TermsOfServicePage() {
  return (
    <article>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-1"><strong>Effective Date:</strong> {EFFECTIVE_DATE}</p>
      <p className="text-sm text-gray-500 mb-8"><strong>Last Updated:</strong> {EFFECTIVE_DATE}</p>

      <P>
        These Terms of Service ("Terms") govern your access to and use of the Lessons Scheduler application and
        related services (the "Service") provided by Ronen Wolfsberger ("we," "us," or "our").
      </P>
      <P>
        By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the
        Service.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>1. Eligibility</H2>
      <P>
        You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account and enter
        into these Terms. If you use the Service on behalf of an organization, you represent that you are authorized to
        bind it to these Terms.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>2. Account Registration</H2>
      <P>
        You agree to provide accurate, current, and complete information during registration and to keep it updated.
        You are responsible for safeguarding your account credentials and for all activity under your account. Notify
        us immediately at <Email /> if you suspect unauthorized access.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>3. The Service</H2>
      <P>
        Lessons Scheduler is an application that helps users schedule, manage, and track lessons, sessions, or
        appointments. Specific features may change over time. We may add, modify, or remove features at our discretion.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>4. Subscriptions and Payments</H2>

      <H3>4.1 Subscription Plans</H3>
      <P>
        The Service offers paid subscription plans. Plan details — including price, billing cycle, included features,
        and any free trial — are disclosed at the point of purchase.
      </P>

      <H3>4.2 Billing</H3>
      <UL>
        <li>Subscriptions are billed through <strong>Google Play Billing</strong> on Android or Stripe where permitted.</li>
        <li>By subscribing, you authorize us (or the billing provider) to charge the applicable fees to your selected payment method on each renewal.</li>
        <li>Prices are shown inclusive of or exclusive of taxes as required by local law. You are responsible for any applicable taxes.</li>
      </UL>

      <H3>4.3 Auto-Renewal</H3>
      <UL>
        <li><strong>Subscriptions automatically renew</strong> at the end of each billing period at the then-current rate until cancelled.</li>
        <li>You will be charged no earlier than 24 hours before the start of each new billing period.</li>
        <li>To avoid renewal, you must cancel at least 24 hours before the current period ends.</li>
      </UL>

      <H3>4.4 Free Trials</H3>
      <P>
        If a free trial is offered, it converts to a paid subscription at the end of the trial unless cancelled before
        the trial ends. Only one free trial is available per user.
      </P>

      <H3>4.5 Price Changes</H3>
      <P>
        We may change subscription prices. Where required, we will notify you in advance and give you the opportunity
        to cancel before the new price takes effect. Continued use after the effective date constitutes acceptance of
        the new price.
      </P>

      <H3>4.6 Cancellation</H3>
      <P>You can cancel at any time:</P>
      <UL>
        <li><strong>Google Play subscriptions:</strong> Google Play app → Subscriptions → Lessons Scheduler → Cancel.</li>
        <li><strong>Direct subscriptions:</strong> in-app Settings → Subscription → Cancel, or by contacting <Email />.</li>
      </UL>
      <P>Cancellation stops future renewals. You retain access through the end of the current paid period.</P>

      <H3>4.7 Refunds</H3>
      <P>
        See our{' '}
        <a href="https://refundpolicy.lessons-scheduler.com" className="text-blue-600 hover:underline">
          Refund Policy
        </a>{' '}
        for details. In general, purchases made through Google Play are subject to Google Play's refund policy.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>5. Acceptable Use</H2>
      <P>You agree not to:</P>
      <UL>
        <li>Use the Service for unlawful purposes or in violation of these Terms.</li>
        <li>Upload or share content that is infringing, defamatory, harassing, harmful, or otherwise objectionable.</li>
        <li>Attempt to reverse-engineer, decompile, or bypass security measures of the Service.</li>
        <li>Interfere with or disrupt the Service or servers.</li>
        <li>Use automated means (bots, scrapers) to access the Service without our written consent.</li>
        <li>Resell, sublicense, or commercially exploit the Service without authorization.</li>
        <li>Use the Service to spam, phish, or transmit malware.</li>
      </UL>
      <P>We may suspend or terminate accounts that violate these rules.</P>

      <hr className="my-8 border-gray-200" />

      <H2>6. User Content</H2>
      <P>
        You retain ownership of content you submit to the Service (e.g., lesson notes, student lists, schedules —
        "User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to
        host, store, reproduce, and display it solely to operate and provide the Service to you.
      </P>
      <P>
        You are responsible for your User Content, including that you have the right to submit it and that it does not
        violate any law or third-party right.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>7. Intellectual Property</H2>
      <P>
        The Service, including its software, design, logos, trademarks, and content provided by us, is owned by Ronen
        Wolfsberger or our licensors and is protected by intellectual property laws. We grant you a limited,
        non-exclusive, non-transferable, revocable license to use the Service for personal or internal business use,
        subject to these Terms.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>8. Third-Party Services</H2>
      <P>
        The Service may integrate with third-party services (e.g., Google Calendar, payment processors). Use of
        third-party services is governed by their own terms. We are not responsible for third-party services.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>9. Termination</H2>
      <P>
        You may stop using the Service and delete your account at any time. We may suspend or terminate your access if
        you violate these Terms, if required by law, or to protect the Service or other users.
      </P>
      <P>On termination:</P>
      <UL>
        <li>Your right to use the Service ends immediately.</li>
        <li>Sections that by their nature should survive (e.g., IP, disclaimers, liability, dispute resolution) will survive.</li>
        <li>Prepaid fees are non-refundable except as required by law or our Refund Policy.</li>
      </UL>

      <hr className="my-8 border-gray-200" />

      <H2>10. Disclaimers</H2>
      <P className="uppercase text-sm leading-relaxed">
        The Service is provided "as is" and "as available" without warranties of any kind, express or implied,
        including warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted
        or error-free operation. We do not guarantee that the Service will meet your requirements or that data will
        never be lost.
      </P>
      <P className="text-sm">
        Some jurisdictions do not allow the exclusion of implied warranties, so some of the above may not apply to you.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>11. Limitation of Liability</H2>
      <P className="uppercase text-sm leading-relaxed">
        To the maximum extent permitted by law, Ronen Wolfsberger and its affiliates will not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or
        goodwill, arising out of or related to your use of the Service.
      </P>
      <P className="uppercase text-sm leading-relaxed">
        Our total liability for any claim relating to the Service will not exceed the greater of (a) the amounts you
        paid us in the 12 months before the claim, or (b) USD $100.
      </P>
      <P className="text-sm">Nothing in these Terms limits liability that cannot be limited under applicable law.</P>

      <hr className="my-8 border-gray-200" />

      <H2>12. Indemnification</H2>
      <P>
        You agree to indemnify and hold Ronen Wolfsberger harmless from any claims, damages, losses, and expenses
        (including reasonable legal fees) arising from your User Content, your use of the Service, or your violation
        of these Terms or applicable law.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>13. Changes to the Terms</H2>
      <P>
        We may update these Terms from time to time. If changes are material, we will notify you in-app or by email at
        least 14 days before they take effect. Continued use of the Service after changes take effect constitutes
        acceptance.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>14. Governing Law and Disputes</H2>
      <P>
        These Terms are governed by the laws of Israel, without regard to conflict-of-laws principles. Disputes will
        be resolved in the competent courts of Israel, unless applicable consumer-protection law grants you the right
        to sue in your home jurisdiction.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>15. Miscellaneous</H2>
      <UL>
        <li><strong>Entire Agreement:</strong> these Terms, together with our Privacy Policy and Refund Policy, form the entire agreement between you and us regarding the Service.</li>
        <li><strong>Severability:</strong> if any provision is unenforceable, the remaining provisions stay in effect.</li>
        <li><strong>No Waiver:</strong> our failure to enforce a provision is not a waiver of it.</li>
        <li><strong>Assignment:</strong> you may not assign these Terms without our consent. We may assign them as part of a merger, acquisition, or sale of assets.</li>
      </UL>

      <hr className="my-8 border-gray-200" />

      <H2>16. Contact</H2>
      <address className="not-italic text-gray-700 space-y-1 leading-relaxed">
        <p><strong>Ronen Wolfsberger</strong></p>
        <p>20 Hazabar St., Kadima, Israel</p>
        <p>Support: <Email /></p>
        <p>Legal: <Email /></p>
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
