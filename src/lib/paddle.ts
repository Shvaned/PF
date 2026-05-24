import { prisma } from "@/lib/prisma";
import { Webhooks } from "@paddle/paddle-node-sdk";

const webhooks = new Webhooks();

export const PADDLE_API = process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
  ? "https://sandbox-api.paddle.com"
  : "https://api.paddle.com";

export function paddleHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.PADDLE_API_KEY || ""}`,
  };
}

export async function verifyWebhook(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    return await webhooks.isSignatureValid(rawBody, secret, signatureHeader);
  } catch {
    return false;
  }
}

export async function createPaddleCustomer(userId: string, email: string): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing?.paddleCustomerId) return existing.paddleCustomerId;

  const res = await fetch(`${PADDLE_API}/customers`, {
    method: "POST",
    headers: paddleHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errBody = await res.text();

    // 409 = email already exists as a customer. Extract the existing ID and reuse it.
    if (res.status === 409) {
      const match = errBody.match(/ctm_[a-zA-Z0-9]+/);
      if (match) {
        const reusedId = match[0];
        console.log("[PADDLE] customer_reuse", { email, userId, customerId: reusedId });
        await prisma.subscription.upsert({
          where: { userId },
          update: { paddleCustomerId: reusedId },
          create: { userId, paddleCustomerId: reusedId },
        });
        return reusedId;
      }
    }

    console.error("[PADDLE] customer_create error", { status: res.status, body: errBody.slice(0, 300) });
    throw new Error(`Customer creation failed: ${res.status}`);
  }

  const data = await res.json();
  const customerId = data?.data?.id;
  if (!customerId) throw new Error("No customer ID in response");

  await prisma.subscription.upsert({
    where: { userId },
    update: { paddleCustomerId: customerId },
    create: { userId, paddleCustomerId: customerId },
  });

  return customerId;
}
