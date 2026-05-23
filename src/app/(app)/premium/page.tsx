"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { openPaddleCheckout } from "@/lib/paddle-client";
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

function PremiumContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [profile, setProfile] = useState<{ isPremium: boolean }>({ isPremium: false });

  useEffect(() => {
    if (user) {
      fetch("/api/user/me")
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) setProfile({ isPremium: data.isPremium });
        })
        .catch(() => {});
    }
  }, [user]);

  const isPremium = profile.isPremium;

  async function handleSubscribe() {
    setCheckoutError("");
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Checkout preparation failed");
      }

      const { email, priceId } = await res.json();

      await openPaddleCheckout({
        email,
        priceId,
        successUrl: `${window.location.origin}/premium?checkout=success`,
      });
    } catch (e: any) {
      setCheckoutError(e.message || "Could not open checkout. Please try again.");
      console.error("Checkout error:", e);
    } finally {
      setCheckoutLoading(false);
    }
  }

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

      {/* Success banner */}
      {checkoutSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-[14px] text-center">
          <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-[16px] font-semibold text-green-800 mb-1">Welcome to PrepFit Premium!</h3>
          <p className="text-sm text-green-700 mb-3">Your premium features are unlocked. Start exploring now.</p>
          <Button href="/dashboard">Go to Dashboard</Button>
        </div>
      )}

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
            <Button onClick={handleSubscribe} loading={checkoutLoading} className="w-full py-3">
              {checkoutLoading ? "Opening checkout..." : "Subscribe Now"}
            </Button>
            {checkoutError && (
              <p className="text-red-500 text-sm mt-3 text-center">{checkoutError}</p>
            )}
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
        <div className="text-center flex flex-col sm:flex-row gap-3 justify-center">
          <Button href="/dashboard" variant="secondary">
            Back to Dashboard
          </Button>
          <Button href="/settings">
            Manage Subscription
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-8 h-8 mx-auto border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#6B7280] mt-4">Loading...</p>
      </div>
    }>
      <PremiumContent />
    </Suspense>
  );
}
