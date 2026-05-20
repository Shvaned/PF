import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const features = [
  { label: "Unlimited analyses", free: "3 / day", premium: "Unlimited" },
  { label: "Mock interviews", free: "Locked", premium: "Full access" },
  { label: "PDF exports", free: "Locked", premium: "Included" },
  { label: "Saved history", free: "3 recent", premium: "Full history" },
  { label: "Progress tracking", free: "Locked", premium: "Included" },
  { label: "Weak area trends", free: "Locked", premium: "Included" },
];

export default async function PremiumPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const isPremium = user.isPremium;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#C084FC] to-[#8B5CF6] flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-[24px] font-semibold text-[#111827] mb-2">PrepFit Premium</h1>
        <p className="text-sm text-[#6B7280]">
          {isPremium
            ? "You're on the Premium plan. Thank you for your support!"
            : "Get the most out of your interview preparation"}
        </p>
      </div>

      <Card className="mb-6">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Plan Comparison</h3>
        <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-[#111827]">Feature</th>
                <th className="text-center px-4 py-3 font-medium text-[#6B7280]">Free</th>
                <th className="text-center px-4 py-3 font-medium text-[#2563EB]">Premium</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.label} className="border-t border-[#E5E7EB]">
                  <td className="px-4 py-3 text-[#111827]">{f.label}</td>
                  <td className="px-4 py-3 text-center text-[#6B7280]">{f.free}</td>
                  <td className="px-4 py-3 text-center text-[#2563EB] font-medium">{f.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!isPremium && (
        <div className="text-center">
          <Card className="mb-6 bg-gradient-to-r from-[#60A5FA]/10 to-[#2563EB]/10 border border-[#2563EB]/20">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-[18px] text-[#9CA3AF] line-through">$5.99/mo</span>
              <span className="text-[28px] font-bold text-[#2563EB]">$2.99/mo</span>
            </div>
            <p className="text-sm text-[#6B7280] mb-4">50% off — Cancel anytime. No commitment.</p>
            <Button className="w-full py-3">
              Subscribe Now
            </Button>
          </Card>
          <p className="text-xs text-[#9CA3AF]">
            Secure payment powered by Paddle. By subscribing you agree to our{" "}
            <a href="/terms" className="text-[#2563EB] hover:underline">Terms</a>,{" "}
            <a href="/privacy" className="text-[#2563EB] hover:underline">Privacy Policy</a>, and{" "}
            <a href="/refund-policy" className="text-[#2563EB] hover:underline">Refund Policy</a>.
          </p>
        </div>
      )}

      {isPremium && (
        <div className="text-center">
          <Button href="/dashboard" variant="secondary">
            Back to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
