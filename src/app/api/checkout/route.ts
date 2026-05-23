import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const priceId = process.env.PADDLE_PRICE_ID;
  if (!priceId) {
    return Response.json({ error: "Checkout not configured" }, { status: 500 });
  }

  console.log("[CHECKOUT] ready", { userId: user.id, priceId });

  return Response.json({
    priceId,
    email: user.email,
    userId: user.id,
  });
}
