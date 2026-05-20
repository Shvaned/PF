import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PrepFit",
  description: "How PrepFit collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
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
          <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#9CA3AF] mb-8">Last updated: May 2026</p>

          <div className="prose prose-sm max-w-none text-[#374151] space-y-6">
            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">1. Information We Collect</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                We collect information you provide directly: name, email address, date of birth, and authentication data
                via Google Sign-In or email/password registration. We also collect content you upload or submit, including
                resumes, job descriptions, interview answers, and feedback.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">2. Resume and Job Description Processing</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                When you upload a resume or paste a job description, the content is transmitted to our AI service provider
                (OpenRouter/OpenAI) for analysis and question generation. This content is stored in our database so you can
                access past analyses. You may delete your data at any time through account deletion.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">3. Interview Response Storage</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Mock interview responses and AI evaluations are stored to provide feedback, track your progress, and identify
                recurring weak areas. This data is associated with your account and is deleted when you delete your account.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">4. Authentication Data</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                We use Firebase Authentication for sign-in. Firebase stores your email, name, and a unique identifier.
                We do not have access to your Google password. A session cookie is stored in your browser to keep you signed in.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">5. Analytics</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                We collect anonymous usage data including feature engagement, analysis counts, and error events to improve
                the Service. This data does not identify individual users.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">6. Payment Processing</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                We use Paddle to process subscription payments. Paddle collects and stores your payment method, billing
                address, and transaction history. We do not store your full credit card details. See{" "}
                <a href="https://paddle.com/privacy" className="text-[#2563EB] hover:underline">Paddle&apos;s Privacy Policy</a>{" "}
                for details on how they handle your payment data.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">7. Third-Party Providers</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-2">
                We rely on the following providers to operate the Service. Each processes data per its own privacy policy:
              </p>
              <ul className="text-sm text-[#6B7280] space-y-1 list-disc pl-5">
                <li><strong>Firebase (Google)</strong> — authentication and user identity</li>
                <li><strong>Paddle</strong> — subscription payments and billing</li>
                <li><strong>OpenRouter / OpenAI</strong> — AI analysis and content generation</li>
                <li><strong>Neon</strong> — database hosting</li>
                <li><strong>Vercel</strong> — application hosting</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">8. Cookies and Session Handling</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                We use a single session cookie to maintain your authentication state. This cookie is essential for the Service
                to function. We do not use third-party tracking cookies or advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">9. Data Retention and Deletion</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                We retain your data as long as your account is active. You may request deletion of your data at any time via
                the account deletion option in Settings. Upon deletion, your account, analyses, interview data, and personal
                information are permanently removed. Some anonymized usage logs may be retained for operational purposes.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">10. Data Security</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                We implement reasonable security measures to protect your data, including encryption in transit (TLS) and
                at rest. However, no method of electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">11. Children&apos;s Privacy</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                The Service is not intended for users under the age of 13. We do not knowingly collect personal information
                from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-[#111827] mb-2">12. Contact</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                For privacy inquiries or data deletion requests, email{" "}
                <a href="mailto:support.prepfit@gmail.com" className="text-[#2563EB] hover:underline">support.prepfit@gmail.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
