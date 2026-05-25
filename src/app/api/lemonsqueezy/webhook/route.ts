import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextRequest } from "next/server";

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const digest = hmac.digest("hex");
  const sigBuf = Buffer.from(signature, "utf8");
  const digBuf = Buffer.from(digest, "utf8");
  if (sigBuf.length !== digBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, digBuf);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[LS_WEBHOOK] no_secret");
    return Response.json({ ok: true }); // always 200
  }

  const valid = verifySignature(rawBody, signature, secret);
  if (!valid) {
    console.error("[LS_WEBHOOK] invalid_signature");
    return Response.json({ ok: true }); // always 200
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch {
    return Response.json({ ok: true });
  }

  const eventName = event?.meta?.event_name;
  const eventData = event?.data;
  const customData = event?.meta?.custom_data;
  const userId = customData?.user_id;

  console.log("[LS_WEBHOOK]", eventName);

  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const customerId = String(eventData?.attributes?.customer_id || "");
        const subId = String(eventData?.id || "");
        const status = eventData?.attributes?.status || "";

        if (!userId) {
          console.warn("[LS_WEBHOOK] no user_id for", eventName);
          break;
        }

        // Upsert subscription
        const existing = await prisma.subscription.findUnique({ where: { userId } });
        if (existing) {
          await prisma.subscription.update({
            where: { userId },
            data: {
              lemonSqueezyCustomerId: customerId,
              lemonSqueezySubscriptionId: subId,
              status,
              planId: String(eventData?.attributes?.variant_id || ""),
              currentPeriodEnd: eventData?.attributes?.renews_at
                ? new Date(eventData.attributes.renews_at) : null,
            },
          });
        } else {
          await prisma.subscription.create({
            data: {
              userId,
              lemonSqueezyCustomerId: customerId,
              lemonSqueezySubscriptionId: subId,
              status,
              planId: String(eventData?.attributes?.variant_id || ""),
              currentPeriodEnd: eventData?.attributes?.renews_at
                ? new Date(eventData.attributes.renews_at) : null,
            },
          });
        }

        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: status === "active" || status === "on_trial" },
        });

        console.log("[LS_WEBHOOK]", eventName, "ok", { userId, status });
        break;
      }

      case "subscription_paused":
      case "subscription_unpaused":
      case "subscription_resumed":
      case "subscription_cancelled":
      case "subscription_expired": {
        if (!userId) break;
        const statusMap: Record<string, string> = {
          subscription_paused: "paused",
          subscription_unpaused: "active",
          subscription_resumed: "active",
          subscription_cancelled: "cancelled",
          subscription_expired: "expired",
        };
        const newStatus = statusMap[eventName] || eventName;
        const premiumActive = newStatus === "active" || newStatus === "on_trial";

        await prisma.subscription.update({
          where: { userId },
          data: { status: newStatus },
        });
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: premiumActive },
        });
        console.log("[LS_WEBHOOK]", eventName, "ok", { userId, newStatus, premiumActive });
        break;
      }

      case "subscription_payment_success": {
        if (!userId) break;
        const renewsAt = eventData?.attributes?.renews_at;
        if (renewsAt) {
          await prisma.subscription.update({
            where: { userId },
            data: { currentPeriodEnd: new Date(renewsAt), status: "active" },
          });
        }
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
        console.log("[LS_WEBHOOK] payment_success", { userId });
        break;
      }

      case "subscription_payment_failed": {
        if (!userId) break;
        await prisma.subscription.update({
          where: { userId },
          data: { status: "past_due" },
        });
        console.warn("[LS_WEBHOOK] payment_failed", { userId });
        break;
      }

      case "order_created": {
        console.log("[LS_WEBHOOK] order_created", {
          orderId: eventData?.id,
          userId,
        });
        break;
      }
    }
  } catch (err: any) {
    console.error("[LS_WEBHOOK] processing_error", err?.message);
  }

  // Always return 200 — LS retries on non-200
  return Response.json({ ok: true });
}
