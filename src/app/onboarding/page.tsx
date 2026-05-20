"use client";

import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, googleProvider } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  async function handleGoogleSignUp() {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      /* set session cookie before redirecting so proxy allows /dashboard */
      const token = await result.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      router.push("/dashboard");
    } catch (e: any) {
      if (e.code === "auth/popup-closed-by-user") {
        // user dismissed the popup — not an error
      } else {
        console.error("Google sign-in error:", e);
        setGoogleError(e.message || "Google sign-in failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center">
            <span className="text-white font-bold text-2xl">PF</span>
          </div>
          <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Welcome to PrepFit</h1>
          <p className="text-[15px] text-[#6B7280] leading-relaxed">
            Prepare for interviews faster. Upload your resume, paste a job description, and get
            AI-powered analysis, questions, and answer guidance — all in minutes.
          </p>
        </div>

        <div className="space-y-3">
          <button onClick={handleGoogleSignUp} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] text-[#111827] font-medium rounded-[12px] py-3 hover:bg-gray-50 transition-colors text-sm shadow-sm disabled:opacity-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>
          {googleError && <p className="text-red-500 text-sm text-center">{googleError}</p>}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E7EB]" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#F5F7FB] px-3 text-[#9CA3AF]">or</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/register"
              className="w-full py-3 bg-[#2563EB] text-white font-medium rounded-[12px] hover:bg-[#1D4ED8] transition-colors text-sm">
              Create Account
            </Link>
            <Link href="/signin"
              className="w-full py-3 border border-[#E5E7EB] text-[#111827] font-medium rounded-[12px] hover:bg-gray-50 transition-colors text-sm">
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-[16px] bg-gradient-to-r from-[#60A5FA]/10 to-[#2563EB]/10 border border-[#2563EB]/10 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">PREMIUM</span>
            <span className="text-xs text-[#9CA3AF] line-through mr-1">$5.99</span>
            <span className="text-sm font-medium text-[#111827]">$2.99/mo</span>
          </div>
          <p className="text-sm text-[#6B7280]">Unlimited analyses, AI mock interviews with scoring, weakness tracking, PDF exports, and more.</p>
        </div>

        <p className="mt-6 text-xs text-[#9CA3AF]">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-[#2563EB] hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#2563EB] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
