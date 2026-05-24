import { getCurrentUser } from "@/lib/auth-helpers";
import { createPaddleCustomer } from "@/lib/paddle";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const priceId = process.env.PADDLE_PRICE_ID;
  if (!priceId) {
    return Response.json({ error: "Checkout not configured" }, { status: 500 });
  }

  // Create/reuse Paddle customer for webhook mapping
  if (user.email) {
    try {
      await createPaddleCustomer(user.id, user.email);
    } catch (e: any) {
      console.error("[CHECKOUT] customer error", e?.message);
    }
  }

  console.log("[CHECKOUT] ready", { userId: user.id, priceId });
  return Response.json({ priceId, email: user.email, userId: user.id });
}
