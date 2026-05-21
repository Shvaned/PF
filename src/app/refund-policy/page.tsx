import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — PrepFit",
  description: "PrepFit's refund and cancellation policy for premium subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <a href="/" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </a>
        </div>

        <div className="bg-white rounded-[16px] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Refund Policy</h1>
          <p className="text-sm text-[#9CA3AF] mb-8">Last updated: May 2026</p>

          <div className="prose prose-sm max-w-none text-[#374151] space-y-6">
            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">1. Digital Subscription Policy</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                PrepFit Premium is a digital service with immediate access upon subscription. As a general policy, digital
                subscriptions are non-refundable because you receive instant access to premium features upon payment.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">2. When Refunds Apply</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                We evaluate refund requests case by case. Refunds are typically considered in the following situations:
              </p>
              <ul className="text-sm text-[#6B7280] space-y-1 list-disc pl-5 mt-2">
                <li>Duplicate or erroneous charges</li>
                <li>Technical issues that prevented access to premium features for 3+ consecutive days</li>
                <li>Requests submitted within 48 hours of the initial charge (first-time subscribers only)</li>
                <li>Circumstances required by applicable consumer protection laws in your jurisdiction</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">3. How to Request a Refund</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                To request a refund, email{" "}
                <a href="mailto:support.prepfit@gmail.com" className="text-[#2563EB] hover:underline">support.prepfit@gmail.com</a>{" "}
                with the following information:
              </p>
              <ul className="text-sm text-[#6B7280] space-y-1 list-disc pl-5 mt-2">
                <li>Email address associated with your account</li>
                <li>Date of the charge</li>
                <li>Reason for the refund request</li>
              </ul>
              <p className="text-sm text-[#6B7280] leading-relaxed mt-2">
                We aim to respond to all refund requests within 2 business days. Approved refunds are processed within
                5–10 business days and credited to your original payment method.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">4. Billing Disputes</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                If you believe a charge is incorrect, please contact us before filing a dispute with your bank or card issuer.
                We can resolve most billing issues directly and faster than a formal dispute process. Chargebacks may result
                in account suspension while the dispute is under review.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">5. Cancellation</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                You can cancel your subscription at any time. Cancellation stops future billing but does not issue a refund
                for the current billing period. Your premium access continues until the end of your current billing period.
                To cancel, use the cancellation option in your account settings or contact us directly.
              </p>
              <p className="text-sm text-[#6B7280] leading-relaxed mt-2">
                <strong>Important:</strong> Deleting your account does not automatically cancel your subscription.
                Please cancel your subscription first, then delete your account.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">6. Trial Periods and Promotional Pricing</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Any free trial or promotional pricing terms are specified at checkout. After a trial period ends, standard
                subscription charges apply unless you cancel before the trial expires. Promotional pricing is valid for the
                stated period; regular rates apply thereafter.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">7. Contact</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                For billing questions or refund requests, email{" "}
                <a href="mailto:support.prepfit@gmail.com" className="text-[#2563EB] hover:underline">support.prepfit@gmail.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
