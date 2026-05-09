"use client";

import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });

      /* set session cookie so the verify-email page can check auth state */
      const token = await user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: user.uid, name, email, dob }),
      });

      await sendEmailVerification(user);
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      const errorMessages: Record<string, string> = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/weak-password": "Password is too weak.",
        "auth/invalid-email": "Invalid email address.",
      };
      setError(errorMessages[e.code] || e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <Link href="/onboarding" className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111827] transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center">
            <span className="text-white font-bold text-lg">PF</span>
          </div>
          <h1 className="text-[20px] font-semibold text-[#111827] mb-1">Create your account</h1>
          <p className="text-sm text-[#6B7280]">Start preparing for interviews faster</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required
            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 bg-white" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required
            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 bg-white" />
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required
            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 bg-white text-[#111827]" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required
            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 bg-white" />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required
            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 bg-white" />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#2563EB] text-white font-medium rounded-[12px] hover:bg-[#1D4ED8] transition-colors text-sm disabled:opacity-50">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#6B7280]">
          Already have an account?{" "}
          <Link href="/signin" className="text-[#2563EB] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
