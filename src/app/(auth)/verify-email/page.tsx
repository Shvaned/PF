"use client";

import { useAuth } from "@/lib/auth-context";
import { sendEmailVerification } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function VerifyForm() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resent, setResent] = useState(false);

  async function handleResend() {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setResent(true);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-[20px] font-semibold text-[#111827] mb-2">Check your email</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          We sent a verification link to <span className="font-medium text-[#111827]">{email}</span>
        </p>
        <p className="text-sm text-[#6B7280] mb-4">
          Click the link in the email to verify your account, then you can sign in.
        </p>
        <button onClick={handleResend} disabled={resent || !user}
          className="text-sm text-[#2563EB] font-medium hover:underline disabled:text-[#9CA3AF]">
          {resent ? "Email resent" : "Resend email"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}
