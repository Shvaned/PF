import { prisma } from "@/lib/prisma";
import { verifyWebhook } from "@/lib/paddle";
import { NextRequest } from "next/server";

async function findUserByCustomerId(customerId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { paddleCustomerId: customerId },
  });
  if (!sub) return null;
  return { userId: sub.userId, subscriptionId: sub.id, subscription: sub };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("paddle-signature") || "";

    console.log("[WEBHOOK] received", {
      hasSecret: !!process.env.PADDLE_WEBHOOK_SECRET,
      secretLen: (process.env.PADDLE_WEBHOOK_SECRET || "").length,
      bodyLen: body.length,
      sigLen: signature.length,
      sigPreview: signature.slice(0, 60),
      eventType: (() => { try { return JSON.parse(body).event_type; } catch { return "parse_error"; } })(),
    });

    if (!process.env.PADDLE_WEBHOOK_SECRET) {
      return Response.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const isValid = await verifyWebhook(body, signature);
    if (!isValid) {
      console.error("[WEBHOOK] verify failed", {
        sigHeader: signature.slice(0, 80),
        bodyPreview: body.slice(0, 100),
      });
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const data = event.data;

    switch (eventType) {
      // ── Subscription lifecycle ──
      case "subscription.activated":
      case "subscription.updated": {
        const customerId = data.customer_id;
        const subscription = await prisma.subscription.findFirst({
          where: { paddleCustomerId: customerId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              paddleSubscriptionId: data.id,
              status: data.status,
              planId: data.items?.[0]?.price_id,
              currentPeriodEnd: data.current_billing_period?.ends_at
                ? new Date(data.current_billing_period.ends_at)
                : null,
              canceledAt: data.canceled_at ? new Date(data.canceled_at) : null,
            },
          });

          await prisma.user.update({
            where: { id: subscription.userId },
            data: {
              isPremium: data.status === "active" || data.status === "trialing",
            },
          });
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.past_due": {
        const customerId = data.customer_id;
        const subscription = await prisma.subscription.findFirst({
          where: { paddleCustomerId: customerId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: data.status },
          });

          if (eventType === "subscription.canceled") {
            await prisma.user.update({
              where: { id: subscription.userId },
              data: { isPremium: false },
            });
          }
        }
        break;
      }

      // ── Transaction events ──
      case "transaction.completed": {
        const customerId = data.customer_id;
        const txId = data.id;
        const subscriptionId = data.subscription_id;

        console.info("[WEBHOOK] transaction.completed", {
          transactionId: txId,
          subscriptionId,
          customerId,
          status: data.status,
          origin: data.origin,
        });

        // Only act on subscription-related transactions (ignore one-off payments)
        if (!subscriptionId) {
          console.info("[WEBHOOK] transaction.completed skip — no subscription_id");
          break;
        }

        const mapping = await findUserByCustomerId(customerId);
        if (!mapping) {
          console.warn("[WEBHOOK] transaction.completed no_user", { customerId, txId });
          break;
        }

        // Idempotent: only update if not already active
        const changes: Record<string, any> = {};
        if (mapping.subscription.paddleSubscriptionId !== subscriptionId) {
          changes.paddleSubscriptionId = subscriptionId;
        }
        if (mapping.subscription.status !== "active") {
          changes.status = "active";
        }
        if (Object.keys(changes).length > 0) {
          await prisma.subscription.update({
            where: { id: mapping.subscriptionId },
            data: changes,
          });
        }

        // Ensure premium is active (idempotent — no-op if already premium)
        await prisma.user.update({
          where: { id: mapping.userId },
          data: { isPremium: true },
        });

        console.info("[WEBHOOK] transaction.completed premium_activated", { userId: mapping.userId });
        break;
      }

      case "transaction.payment_failed": {
        const customerId = data.customer_id;
        const txId = data.id;
        const subscriptionId = data.subscription_id;

        console.warn("[WEBHOOK] transaction.payment_failed", {
          transactionId: txId,
          subscriptionId,
          customerId,
        });

        if (!subscriptionId) {
          console.info("[WEBHOOK] transaction.payment_failed skip — no subscription_id");
          break;
        }

        const mapping = await findUserByCustomerId(customerId);
        if (!mapping) {
          console.warn("[WEBHOOK] transaction.payment_failed no_user", { customerId, txId });
          break;
        }

        // Mark subscription as past_due but do NOT revoke premium yet.
        // Paddle will later send subscription.past_due or subscription.canceled
        // if the payment ultimately fails after retries.
        if (mapping.subscription.status !== "past_due" && mapping.subscription.status !== "canceled") {
          await prisma.subscription.update({
            where: { id: mapping.subscriptionId },
            data: { status: "past_due" },
          });
        }

        console.warn("[WEBHOOK] transaction.payment_failed marked_past_due", { userId: mapping.userId });
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
