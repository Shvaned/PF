import { getCurrentUser } from "@/lib/auth-helpers";
import { createPaddleCustomer } from "@/lib/paddle";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  if (!user.email) {
    return Response.json({ error: "Account email required" }, { status: 400 });
  }

  const priceId = process.env.PADDLE_PRICE_ID;
  if (!priceId) {
    return Response.json({ error: "Checkout not configured" }, { status: 500 });
  }

  try {
    const customerId = await createPaddleCustomer(user.id, user.email);

    return Response.json({
      customerId,
      email: user.email,
      priceId,
    });
  } catch (error) {
    console.error("Checkout preparation error:", error);
    return Response.json(
      { error: "Failed to prepare checkout" },
      { status: 500 }
    );
  }
}
