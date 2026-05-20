"use client";

import { useState } from "react";
import Button from "./Button";

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePortal() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to open portal");

      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || "Could not open billing portal");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handlePortal} loading={loading} variant="secondary">
        {loading ? "Opening..." : "Manage billing"}
      </Button>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
