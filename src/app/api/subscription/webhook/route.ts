import { prisma } from "@/lib/prisma";
import { verifyWebhook } from "@/lib/paddle";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("paddle-signature") || "";

    if (!process.env.PADDLE_WEBHOOK_SECRET) {
      return Response.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const isValid = await verifyWebhook(body, signature);
    if (!isValid) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const data = event.data;

    switch (eventType) {
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
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
