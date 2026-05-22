import { prisma } from "@/lib/prisma";

const PADDLE_API = "https://api.paddle.com";

function paddleHeaders() {
  const key = (process.env.PADDLE_API_KEY || "").trim();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
}

export async function createPaddleCustomer(userId: string, email: string): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing?.paddleCustomerId) {
    console.log("[PADDLE] customer_skip existing", { userId, customerId: existing.paddleCustomerId });
    return existing.paddleCustomerId;
  }

  console.log("[PADDLE] customer_create api_call", { userId, email, api: PADDLE_API });

  const res = await fetch(`${PADDLE_API}/customers`, {
    method: "POST",
    headers: paddleHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[PADDLE] customer_create api_error", {
      status: res.status,
      body: errBody.slice(0, 500),
      api: PADDLE_API,
      hasApiKey: !!process.env.PADDLE_API_KEY,
    });
    throw new Error(`Paddle customer creation failed: ${res.status} ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  const customerId = data?.data?.id;
  if (!customerId) {
    console.error("[PADDLE] customer_create missing_id", { responseKeys: Object.keys(data) });
    throw new Error("Paddle customer creation returned no customer ID");
  }

  console.log("[PADDLE] customer_create db_upsert", { userId, customerId });
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
