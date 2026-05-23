import { prisma } from "@/lib/prisma";

const PADDLE_API = (process.env.PADDLE_API_KEY || "").includes("sdbx")
  ? "https://sandbox-api.paddle.com"
  : "https://api.paddle.com";

console.log("[PADDLE] init", { api: PADDLE_API });

function paddleHeaders() {
  const raw = process.env.PADDLE_API_KEY || "";
  const key = raw.trim();
  // Log key characteristics (never the key itself)
  console.log("[PADDLE] auth_header", {
    keyLength: key.length,
    keyPrefix: key.slice(0, 11),
    hasWhitespace: raw.length !== key.length,
    hasBearer: true,
  });
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

    // Handle duplicate email: extract existing customer ID and reuse it
    if (res.status === 409) {
      try {
        const errJson = JSON.parse(errBody);
        const detail = errJson?.error?.detail || "";
        const match = detail.match(/ctm_[a-zA-Z0-9]+/);
        if (match) {
          const reusedId = match[0];
          console.info("[PADDLE] customer_reuse_existing", { email, userId, customerId: reusedId });
          await prisma.subscription.upsert({
            where: { userId },
            update: { paddleCustomerId: reusedId },
            create: { userId, paddleCustomerId: reusedId },
          });
          return reusedId;
        }
      } catch {
        // fall through to throw below
      }
    }

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

export async function verifyWebhook(body: string, signatureHeader: string): Promise<boolean> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return false;

  // Parse Paddle Billing signature: "ts={timestamp};h1={signature_hex}"
  const ts = signatureHeader.match(/ts=(\d+)/)?.[1];
  const h1 = signatureHeader.match(/h1=([a-f0-9]+)/)?.[1];

  if (!ts || !h1) {
    console.error("[WEBHOOK] verify parse_failed", { headerPreview: signatureHeader.slice(0, 80) });
    return false;
  }

  const encoder = new TextEncoder();
  const payload = `${ts}:${body}`;

  // Compute HMAC-SHA256 manually so we can log the comparison
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const computed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  const computedHex = [...new Uint8Array(computed)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const match = computedHex === h1;

  console.log("[WEBHOOK_COMPARE]", {
    receivedPrefix: h1.slice(0, 20),
    computedPrefix: computedHex.slice(0, 20),
    match,
    bodyLen: body.length,
    ts,
    secretPrefix: secret.slice(0, 6),
    secretLen: secret.length,
  });

  return match;
}

export function isPremiumActive(subscriptionStatus: string | null): boolean {
  return subscriptionStatus === "active" || subscriptionStatus === "trialing";
}
