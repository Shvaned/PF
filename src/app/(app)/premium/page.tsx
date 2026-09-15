"use client";

import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
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
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/user/me")
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setIsPremium(d.isPremium); })
        .catch(() => {});
    }
  }, [user]);

  async function handleSubscribe() {
    setCheckoutError("");
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/lemonsqueezy/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/premium?checkout=success`,
          cancelUrl: `${window.location.origin}/premium?checkout=cancelled`,
        }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (e: any) {
      setCheckoutError(e.message || "Could not open checkout");
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="text-center md:text-left">
          <div className="w-16 h-16 mx-auto md:mx-0 mb-4 rounded-2xl bg-gradient-to-br from-[#C084FC] to-[#8B5CF6] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-[24px] font-semibold text-[#111827] mb-2">PrepFit Premium</h1>
          <p className="text-sm text-[#6B7280]">
            {isPremium ? "You're on the Premium plan. Thank you for your support!" : "Get the most out of your interview preparation"}
          </p>
        </div>

        <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/60 shadow-none">
          <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold uppercase tracking-wide">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm-.75 4.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zM10 13.5a1 1 0 110 2 1 1 0 010-2z" />
            </svg>
            Early Access
          </div>
          <h3 className="text-[15px] font-semibold text-[#111827] mb-1">Premium is free during development</h3>
          <p className="text-[13px] text-[#6B7280] mb-3">
            Payments are in test mode. Subscribe for free using these test card details:
          </p>
          <dl className="text-[13px] space-y-1.5">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[#6B7280] shrink-0">Card number</dt>
              <dd className="font-mono text-[#111827] text-right">4242 4242 4242 4242</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[#6B7280] shrink-0">Expiration</dt>
              <dd className="text-[#111827] text-right">Any future date (e.g. 12/35)</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[#6B7280] shrink-0">CVC</dt>
              <dd className="text-[#111827] text-right">Any 3 digits (e.g. 123)</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[#6B7280] shrink-0">Name & address</dt>
              <dd className="text-[#111827] text-right">Any dummy values</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="max-w-2xl mx-auto">
      {checkoutSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-[14px] text-center">
          <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-[16px] font-semibold text-green-800 mb-1">Welcome to PrepFit Premium!</h3>
          <p className="text-sm text-green-700 mb-3">Your premium features are unlocking. Explore now.</p>
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
            {checkoutError && <p className="text-red-500 text-sm mt-3 text-center">{checkoutError}</p>}
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
          <Button href="/dashboard" variant="secondary">Back to Dashboard</Button>
          <Button href="/settings">Manage Subscription</Button>
        </div>
      )}
      </div>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto text-center py-12"><div className="w-8 h-8 mx-auto border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>}>
      <PremiumContent />
    </Suspense>
  );
}
