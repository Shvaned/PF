import { prisma } from "@/lib/prisma";
import { verifyWebhook } from "@/lib/paddle";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature") || "";
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!secret) {
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const valid = await verifyWebhook(rawBody, signature, secret);
  if (!valid) {
    console.error("[WEBHOOK] invalid_signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const type = event.event_type;
  const data = event.data;

  console.log("[WEBHOOK]", type);

  switch (type) {
    case "subscription.activated":
    case "subscription.updated": {
      const customerId = data.customer_id;
      let sub = await prisma.subscription.findFirst({
        where: { paddleCustomerId: customerId },
      });

      if (!sub && data.custom_data?.userId) {
        sub = await prisma.subscription.create({
          data: {
            userId: data.custom_data.userId,
            paddleCustomerId: customerId,
            status: data.status,
          },
        });
        console.log("[WEBHOOK] subscription_created", { id: sub.id });
      }

      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            paddleSubscriptionId: data.id,
            status: data.status,
            planId: data.items?.[0]?.price_id,
            currentPeriodEnd: data.current_billing_period?.ends_at
              ? new Date(data.current_billing_period.ends_at) : null,
            canceledAt: data.canceled_at ? new Date(data.canceled_at) : null,
          },
        });

        await prisma.user.update({
          where: { id: sub.userId },
          data: { isPremium: data.status === "active" || data.status === "trialing" },
        });
      }
      break;
    }

    case "subscription.canceled":
    case "subscription.past_due": {
      const customerId = data.customer_id;
      const sub = await prisma.subscription.findFirst({
        where: { paddleCustomerId: customerId },
      });
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: data.status },
        });
        if (type === "subscription.canceled") {
          await prisma.user.update({
            where: { id: sub.userId },
            data: { isPremium: false },
          });
        }
      }
      break;
    }

    case "transaction.completed": {
      const customerId = data.customer_id;
      const sub = await prisma.subscription.findFirst({
        where: { paddleCustomerId: customerId },
      });
      if (sub) {
        await prisma.user.update({
          where: { id: sub.userId },
          data: { isPremium: true },
        });
        console.log("[WEBHOOK] premium_activated", { userId: sub.userId });
      }
      break;
    }

    case "transaction.payment_failed": {
      const customerId = data.customer_id;
      const sub = await prisma.subscription.findFirst({
        where: { paddleCustomerId: customerId },
      });
      if (sub && sub.status !== "past_due" && sub.status !== "canceled") {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "past_due" },
        });
      }
      break;
    }
  }

  return Response.json({ received: true });
}
