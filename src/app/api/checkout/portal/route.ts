import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const PADDLE_API = process.env.PADDLE_API_KEY?.startsWith("apikey_test_") || process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.startsWith("test_")
  ? "https://sandbox-api.paddle.com"
  : "https://api.paddle.com";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!sub?.paddleCustomerId) {
    return Response.json({ error: "No subscription found" }, { status: 404 });
  }

  try {
    const res = await fetch(`${PADDLE_API}/customers/${sub.paddleCustomerId}/portal-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      },
      body: JSON.stringify({
        customer_id: sub.paddleCustomerId,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Paddle portal error:", err);
      return Response.json({ error: "Failed to create portal session" }, { status: 500 });
    }

    const data = await res.json();
    return Response.json({ url: data.data.urls.general });
  } catch (error) {
    console.error("Portal session error:", error);
    return Response.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
