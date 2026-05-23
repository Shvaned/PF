import { prisma } from "@/lib/prisma";

export const PADDLE_API = (process.env.PADDLE_API_KEY || "").includes("sdbx")
  ? "https://sandbox-api.paddle.com"
  : "https://api.paddle.com";

export async function verifyWebhook(body: string, signatureHeader: string): Promise<boolean> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return false;

  const ts = signatureHeader.match(/ts=(\d+)/)?.[1];
  const h1 = signatureHeader.match(/h1=([a-f0-9]+)/)?.[1];
  if (!ts || !h1) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const payload = `${ts}:${body}`;
  const computed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  const computedHex = [...new Uint8Array(computed)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHex === h1;
}

export function isPremiumActive(subscriptionStatus: string | null): boolean {
  return subscriptionStatus === "active" || subscriptionStatus === "trialing";
}
