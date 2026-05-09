"use client";

import { useState } from "react";
import Button from "./Button";
import UpgradeModal from "./UpgradeModal";

interface PremiumGateProps {
  title?: string;
  description?: string;
  blurContent?: React.ReactNode;
}

export default function PremiumGate({
  title = "Unlock Mock Interviews",
  description = "Practice AI interviews and receive proper feedback, track your weak areas, and get a final report.",
  blurContent,
}: PremiumGateProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="relative">
        {/* Blurred content */}
        <div className="blur-sm pointer-events-none opacity-30 select-none">
          {blurContent || (
            <div className="bg-white rounded-[16px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] h-32" />
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-[16px] font-medium text-[#111827] mb-1">{title}</h3>
            <p className="text-sm text-[#6B7280] mb-3 max-w-xs">{description}</p>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[#9CA3AF] line-through">$5.99/mo</span>
            <span className="text-sm font-semibold text-[#2563EB]">$2.99/mo</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#60A5FA] to-[#2563EB] text-white font-medium rounded-[12px] hover:from-[#2563EB] hover:to-[#1D4ED8] transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Upgrade to Premium
          </button>
        </div>
      </div>

      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Unlock Mock Interviews"
        description="Practice AI interviews and receive proper feedback, track your weak areas, and get a final report."
      />
    </>
  );
}
