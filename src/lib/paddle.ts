import { prisma } from "@/lib/prisma";

const PADDLE_API = "https://api.paddle.com";

function paddleHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
  };
}

export async function createPaddleCustomer(userId: string, email: string): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing?.paddleCustomerId) return existing.paddleCustomerId;

  const res = await fetch(`${PADDLE_API}/customers`, {
    method: "POST",
    headers: paddleHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!res.ok) throw new Error(`Paddle customer creation failed: ${res.statusText}`);

  const data = await res.json();
  const customerId = data.data.id;

  await prisma.subscription.upsert({
    where: { userId },
    update: { paddleCustomerId: customerId },
    create: { userId, paddleCustomerId: customerId },
  });

  return customerId;
}

export async function verifyWebhook(body: string, signature: string): Promise<boolean> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const sigBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const verified = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(body)
  );

  return verified;
}

export function isPremiumActive(subscriptionStatus: string | null): boolean {
  return subscriptionStatus === "active" || subscriptionStatus === "trialing";
}
