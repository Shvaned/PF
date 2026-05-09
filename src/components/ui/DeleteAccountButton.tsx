"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import Button from "./Button";

export default function DeleteAccountButton() {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      /* clear Firebase client-side auth state so the onboarding page
         sees a fresh session, not the deleted user cached in IndexedDB */
      await signOut(auth);
      router.push("/onboarding");
    } catch {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        onClick={() => setConfirming(true)}
        variant="secondary"
        className="text-red-500 border-red-200 hover:bg-red-50"
      >
        Delete Account &amp; Data
      </Button>
    );
  }

  return (
    <div className="flex gap-3">
      <Button onClick={handleDelete} loading={loading} className="bg-red-500 hover:bg-red-600 text-white">
        Confirm Delete
      </Button>
      <Button onClick={() => setConfirming(false)} variant="secondary">
        Cancel
      </Button>
    </div>
  );
}
