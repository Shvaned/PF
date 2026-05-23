"use client";

import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import { openPaddleCheckout } from "@/lib/paddle-client";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function UpgradeModal({
  open,
  onClose,
  title = "Unlock Premium Features",
  description = "Practice AI interviews with scoring, track your weak areas, and get a final report.",
}: UpgradeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  async function handleUpgrade() {
    setCheckoutError("");
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Checkout preparation failed");
      }

      const { email, priceId } = await res.json();

      onClose();

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

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-[20px] shadow-2xl max-w-sm w-full p-6 text-center animate-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#9CA3AF]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#C084FC] to-[#8B5CF6] flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        {/* Title & Description */}
        <h2 className="text-[18px] font-semibold text-[#111827] mb-2">{title}</h2>
        <p className="text-sm text-[#6B7280] mb-5">{description}</p>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-[#60A5FA]/10 to-[#2563EB]/10 rounded-[14px] p-4 mb-5 border border-[#2563EB]/10">
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-base text-[#9CA3AF] line-through">$5.99/mo</span>
            <span className="text-[26px] font-bold text-[#2563EB]">$2.99/mo</span>
          </div>
          <p className="text-xs text-[#6B7280]">50% off — Cancel anytime</p>
        </div>

        {/* CTA */}
        <Button onClick={handleUpgrade} loading={checkoutLoading} className="w-full py-3">
          {checkoutLoading ? "Opening checkout..." : "Upgrade to Premium"}
        </Button>

        {checkoutError && (
          <p className="text-red-500 text-sm mt-3 text-center">{checkoutError}</p>
        )}

        <p className="text-xs text-[#9CA3AF] mt-3">
          Secure payment powered by Paddle
        </p>
      </div>
    </div>
  );
}
