import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — PrepFit",
  description: "Terms of service for PrepFit, an AI-powered interview preparation platform.",
};

export default function TermsPage() {
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
          <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Terms of Service</h1>
          <p className="text-sm text-[#9CA3AF] mb-8">Last updated: May 2026</p>

          <div className="prose prose-sm max-w-none text-[#374151] space-y-6">
            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">1. Acceptance of Terms</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                By accessing or using PrepFit (&quot;the Service&quot;), you agree to these Terms of Service. If you do not agree,
                do not use the Service. We may update these terms at any time, and continued use constitutes acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">2. Educational Purpose Disclaimer</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                PrepFit is an educational tool for interview preparation. The Service provides AI-generated analysis,
                practice questions, and feedback. We do not guarantee interview success, job placement, or employment offers.
                Use the Service as a supplement to your own preparation, not as a replacement for professional career advice.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">3. No Employment Guarantee</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                PrepFit does not guarantee that using our Service will result in interview invitations, job offers, or employment.
                Outcomes depend on many factors beyond our control, including your qualifications, market conditions, and
                employer decisions.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">4. AI-Generated Content</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Our Service uses artificial intelligence to generate analysis, questions, and feedback. AI outputs may contain
                inaccuracies, omissions, or biases. You should review and validate all AI-generated content before relying on it.
                We do not warrant the accuracy or completeness of AI-generated materials.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">5. Acceptable Use</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                You agree not to misuse the Service. Prohibited activities include: uploading malicious content, attempting to
                reverse-engineer the Service, using the Service for unlawful purposes, automating access in violation of rate
                limits, or submitting content you do not own or have permission to use.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">6. User Accounts</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                You are responsible for maintaining the security of your account credentials. You must provide accurate
                registration information. We reserve the right to suspend or terminate accounts that violate these terms
                or engage in fraudulent activity.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">7. Subscriptions and Billing</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Premium features require a paid subscription. Subscription fees are billed in advance on a recurring monthly
                basis. You may cancel your subscription at any time; cancellation takes effect at the end of the current
                billing period. No partial refunds are issued for unused portions of a billing cycle unless required by law.
                Pricing may change with notice. We use Paddle for payment processing; see Paddle&apos;s terms for additional details.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">8. Limitations of Liability</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                To the fullest extent permitted by law, PrepFit and its operators shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, including but not limited to loss of employment
                opportunity, loss of data, or loss of profits arising from your use of the Service. Our total liability
                shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">9. Service Availability</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                We strive to keep the Service available but do not guarantee uninterrupted access. We may modify,
                suspend, or discontinue features at any time with reasonable notice where practical.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">10. Governing Law</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                These terms are governed by the laws of the United States without regard to conflict of law principles.
                Any disputes shall be resolved through binding arbitration on an individual basis.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">11. Contact</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Questions about these terms? Contact us at{" "}
                <a href="mailto:legal.prepfit@gmail.com" className="text-[#2563EB] hover:underline">legal.prepfit@gmail.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
