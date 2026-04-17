import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy – Lessons Scheduler',
};

const SUPPORT_EMAIL = 'Support@lessons-scheduler.com';
const EFFECTIVE_DATE = 'April 17, 2026';

function SupportEmail() {
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

function OL({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal list-inside space-y-1 text-gray-700 mb-3">{children}</ol>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">{children}</ul>;
}

export default function RefundPolicyPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund and Cancellation Policy</h1>
      <p className="text-sm text-gray-500 mb-1">
        <strong>Effective Date:</strong> {EFFECTIVE_DATE}
      </p>
      <p className="text-sm text-gray-500 mb-8">
        <strong>Last Updated:</strong> {EFFECTIVE_DATE}
      </p>

      <P>
        This Refund and Cancellation Policy explains how cancellations and refunds work for Lessons Scheduler
        subscriptions offered by Ronen Wolfsberger.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>1. Cancelling Your Subscription</H2>
      <P>
        You can cancel your subscription at any time. Cancellation stops future renewals; you retain access to paid
        features through the end of your current billing period.
      </P>

      <H3>Google Play subscriptions</H3>
      <OL>
        <li>Open the <strong>Google Play Store</strong> app.</li>
        <li>Tap your profile icon → <strong>Payments &amp; subscriptions</strong> → <strong>Subscriptions</strong>.</li>
        <li>Select <strong>Lessons Scheduler</strong> → <strong>Cancel subscription</strong>.</li>
      </OL>

      <H3>Stripe subscriptions</H3>
      <OL>
        <li>Open <strong>Lessons Scheduler</strong> → <strong>Settings</strong> → <strong>Subscription</strong>.</li>
        <li>Tap <strong>Cancel subscription</strong>, or email <SupportEmail />.</li>
      </OL>

      <P>
        To avoid being charged for the next period, cancel at least <strong>24 hours before</strong> your current
        period ends.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>2. Refunds for Google Play Subscriptions</H2>
      <P>
        Subscriptions purchased through Google Play are processed by Google, and Google's refund policy applies. To
        request a refund, follow these steps:
      </P>
      <OL>
        <li>
          Visit{' '}
          <a
            href="https://play.google.com/store/account/subscriptions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            play.google.com/store/account/subscriptions
          </a>
          .
        </li>
        <li>Find your Lessons Scheduler subscription.</li>
        <li>Tap <strong>Report a problem</strong> and follow the prompts.</li>
      </OL>
      <P>
        You can also request a refund directly from us at <SupportEmail />, and we will review the request consistent
        with this policy and Google Play's refund policy.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>3. Refunds for Direct Purchases (Alternative Billing)</H2>
      <P>For subscriptions purchased through Stripe directly from us:</P>

      <H3>Eligible scenarios</H3>
      <P>We will consider refunds in the following cases:</P>
      <UL>
        <li><strong>Accidental or duplicate charge.</strong></li>
        <li><strong>Technical issue</strong> that prevented you from using the Service and was not resolved within a reasonable time.</li>
        <li><strong>Failed cancellation</strong> that was clearly attempted before the renewal.</li>
        <li><strong>Local law requirements</strong> (e.g., statutory withdrawal rights).</li>
      </UL>

      <H3>Not typically eligible</H3>
      <UL>
        <li>Change of mind after the subscription period has begun and the Service has been used.</li>
        <li>Forgetting to cancel before renewal, except as required by law.</li>
        <li>Dissatisfaction with features that were accurately described before purchase.</li>
      </UL>

      <H3>How to request</H3>
      <P>
        Email <SupportEmail /> with:
      </P>
      <UL>
        <li>The email address on your account.</li>
        <li>The date of the charge.</li>
        <li>A brief explanation of the reason.</li>
      </UL>
      <P>
        We aim to respond within <strong>5 business days</strong> and process approved refunds within{' '}
        <strong>10 business days</strong> to your original payment method.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>4. Statutory Withdrawal Rights (EU/UK)</H2>
      <P>
        If you are a consumer in the European Union or the United Kingdom, you generally have a{' '}
        <strong>14-day right of withdrawal</strong> from the date of purchase. By starting to use the Service during
        the withdrawal period, you expressly request immediate performance and acknowledge that you may lose your right
        of withdrawal once the Service has been fully performed. Where the right still applies, you may withdraw by
        contacting <SupportEmail />.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>5. Free Trials</H2>
      <P>
        If a free trial is offered, you will not be charged during the trial. To avoid being charged when the trial
        ends, cancel before the trial expires. Charges that occur after the trial converts are not automatically
        refundable.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>6. Chargebacks</H2>
      <P>
        Before initiating a chargeback with your bank or card issuer, please contact <SupportEmail /> so we can
        attempt to resolve the issue directly. Unresolved chargebacks may result in suspension of your account.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>7. Changes to This Policy</H2>
      <P>
        We may update this policy from time to time. Material changes will be notified in-app or by email. The "Last
        Updated" date reflects the latest revision.
      </P>

      <hr className="my-8 border-gray-200" />

      <H2>8. Contact</H2>
      <address className="not-italic text-gray-700 space-y-1 leading-relaxed">
        <p><strong>Ronen Wolfsberger</strong></p>
        <p>20 Hazabar St., Kadima, Israel</p>
        <p>
          Support: <SupportEmail />
        </p>
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
