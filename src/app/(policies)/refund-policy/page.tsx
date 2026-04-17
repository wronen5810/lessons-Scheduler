import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy – Lessons Scheduler',
};

export default function RefundPolicyPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund and Cancellation Policy</h1>
      <p className="text-sm text-gray-500 mb-8">
        <strong>Effective Date:</strong> April 17, 2026 &nbsp;·&nbsp; <strong>Last Updated:</strong> April 17, 2026
      </p>

      <p>
        This Refund and Cancellation Policy explains how cancellations and refunds work for Lessons Scheduler
        subscriptions offered by Ronen Wolfsberger.
      </p>

      <hr className="my-8 border-gray-200" />

      <Section n="1" title="Cancelling Your Subscription">
        <p>
          You can cancel your subscription at any time. Cancellation stops future renewals; you retain access to paid
          features through the end of your current billing period.
        </p>
        <h3 className="text-lg font-semibold mt-4 mb-2">Google Play subscriptions</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
          <li>Open the <strong>Google Play Store</strong> app.</li>
          <li>Tap your profile icon → <strong>Payments &amp; subscriptions</strong> → <strong>Subscriptions</strong>.</li>
          <li>Select <strong>Lessons Scheduler</strong> → <strong>Cancel subscription</strong>.</li>
        </ol>
        <h3 className="text-lg font-semibold mt-4 mb-2">Direct (Stripe) subscriptions</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
          <li>Open <strong>Lessons Scheduler</strong> → <strong>Settings</strong> → <strong>Subscription</strong>.</li>
          <li>Tap <strong>Cancel subscription</strong>, or email <SupportEmail />.</li>
        </ol>
        <p className="mt-3">
          To avoid being charged for the next period, cancel at least <strong>24 hours before</strong> your current
          period ends.
        </p>
      </Section>

      <Section n="2" title="Refunds for Google Play Subscriptions">
        <p>
          Subscriptions purchased through Google Play are processed by Google, and Google's refund policy applies. To
          request a refund:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
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
        </ol>
        <p className="mt-3">
          You can also request a refund directly from us at <SupportEmail />, and we will review the request consistent
          with this policy and Google Play's refund policy.
        </p>
      </Section>

      <Section n="3" title="Refunds for Direct Purchases">
        <p>For subscriptions purchased directly through Stripe:</p>
        <h3 className="text-lg font-semibold mt-4 mb-2">Eligible scenarios</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Accidental or duplicate charge.</li>
          <li>Technical issue that prevented you from using the Service and was not resolved within a reasonable time.</li>
          <li>Failed cancellation that was clearly attempted before the renewal.</li>
          <li>Local law requirements (e.g., statutory withdrawal rights).</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4 mb-2">Not typically eligible</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Change of mind after the subscription period has begun and the Service has been used.</li>
          <li>Forgetting to cancel before renewal, except as required by law.</li>
          <li>Dissatisfaction with features that were accurately described before purchase.</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4 mb-2">How to request</h3>
        <p>
          Email <SupportEmail /> with: the email address on your account, the date of the charge, and a brief
          explanation of the reason.
        </p>
        <p className="mt-2">
          We aim to respond within <strong>5 business days</strong> and process approved refunds within{' '}
          <strong>10 business days</strong> to your original payment method.
        </p>
      </Section>

      <Section n="4" title="Statutory Withdrawal Rights (EU/UK)">
        <p>
          If you are a consumer in the European Union or the United Kingdom, you generally have a{' '}
          <strong>14-day right of withdrawal</strong> from the date of purchase. By starting to use the Service during
          the withdrawal period, you expressly request immediate performance and acknowledge that you may lose your right
          of withdrawal once the Service has been fully performed. Where the right still applies, you may withdraw by
          contacting <SupportEmail />.
        </p>
      </Section>

      <Section n="5" title="Free Trials">
        <p>
          If a free trial is offered, you will not be charged during the trial. To avoid being charged when the trial
          ends, cancel before the trial expires. Charges that occur after the trial converts are not automatically
          refundable.
        </p>
      </Section>

      <Section n="6" title="Chargebacks">
        <p>
          Before initiating a chargeback with your bank or card issuer, please contact <SupportEmail /> so we can
          attempt to resolve the issue directly. Unresolved chargebacks may result in suspension of your account.
        </p>
      </Section>

      <Section n="7" title="Changes to This Policy">
        <p>
          We may update this policy from time to time. Material changes will be notified in-app or by email. The "Last
          Updated" date reflects the latest revision.
        </p>
      </Section>

      <Section n="8" title="Contact">
        <address className="not-italic text-gray-700 space-y-1">
          <p><strong>Ronen Wolfsberger</strong></p>
          <p>Support: <SupportEmail /></p>
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

function SupportEmail() {
  return (
    <a href="mailto:support@lessons-scheduler.com" className="text-blue-600 hover:underline">
      support@lessons-scheduler.com
    </a>
  );
}
