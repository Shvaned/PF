"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import Button from "./Button";

export default function DeleteAccountButton({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "delete">("confirm");
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const valid = text1 === "I UNDERSTAND" && text2 === userEmail;

  function reset() {
    setOpen(false);
    setStep("confirm");
    setText1("");
    setText2("");
    setError("");
  }

  async function handleDelete() {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      await signOut(auth);
      router.push("/onboarding");
    } catch {
      setError("Deletion failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="secondary"
        className="text-red-500 border-red-200 hover:bg-red-50"
      >
        Delete Account &amp; Data
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={reset} />
          <div className="relative bg-white rounded-[20px] shadow-2xl max-w-md w-full p-6">
            <button onClick={reset} className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h2 className="text-[18px] font-semibold text-[#111827] text-center mb-2">Delete Account</h2>
            <p className="text-sm text-[#6B7280] text-center mb-5">
              This permanently deletes your account, analyses, interview history, stored data, and profile information. This cannot be undone.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#374151]">Type <span className="font-mono bg-gray-100 px-1 rounded">I UNDERSTAND</span></label>
                <input
                  value={text1}
                  onChange={(e) => setText1(e.target.value)}
                  placeholder='I UNDERSTAND'
                  className="w-full mt-1 px-3 py-2 border border-[#E5E7EB] rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151]">Type your email</label>
                <input
                  value={text2}
                  onChange={(e) => setText2(e.target.value)}
                  placeholder={userEmail}
                  className="w-full mt-1 px-3 py-2 border border-[#E5E7EB] rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}

            <div className="flex gap-3 mt-5">
              <Button onClick={handleDelete} loading={loading} disabled={!valid}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-40">
                Delete Forever
              </Button>
              <Button onClick={reset} variant="secondary" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
