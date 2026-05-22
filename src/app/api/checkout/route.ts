import { getCurrentUser } from "@/lib/auth-helpers";
import { createPaddleCustomer } from "@/lib/paddle";

export async function POST() {
  try {
    // Step 1 — auth
    const user = await getCurrentUser();
    if (!user) {
      console.error("[CHECKOUT] step=auth error=unauthenticated");
      return Response.json({ success: false, step: "auth", error: "Sign in to continue" }, { status: 401 });
    }
    console.log("[CHECKOUT] step=auth ok", { userId: user.id, hasEmail: !!user.email });

    // Step 2 — validate email
    if (!user.email) {
      console.error("[CHECKOUT] step=validate error=missing_email", { userId: user.id });
      return Response.json({ success: false, step: "validate", error: "Account email required" }, { status: 400 });
    }
    console.log("[CHECKOUT] step=validate ok", { email: user.email });

    // Step 3 — env check
    const priceId = process.env.PADDLE_PRICE_ID;
    const hasApiKey = !!process.env.PADDLE_API_KEY;
    const hasClientToken = !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    console.log("[CHECKOUT] step=env", {
      hasPriceId: !!priceId,
      hasApiKey,
      hasClientToken,
      apiKeyPrefix: process.env.PADDLE_API_KEY?.slice(0, 11) || "missing",
      tokenPrefix: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.slice(0, 5) || "missing",
    });

    if (!priceId) {
      console.error("[CHECKOUT] step=env error=missing_price_id");
      return Response.json({ success: false, step: "env", error: "Checkout not configured" }, { status: 500 });
    }

    if (!hasApiKey) {
      console.error("[CHECKOUT] step=env error=missing_api_key");
      return Response.json({ success: false, step: "env", error: "Payment provider not configured" }, { status: 500 });
    }

    // Step 4 — create/retrieve Paddle customer
    console.log("[CHECKOUT] step=customer_create start", { userId: user.id, email: user.email });
    let customerId: string;
    try {
      customerId = await createPaddleCustomer(user.id, user.email);
      console.log("[CHECKOUT] step=customer_create ok", { customerId });
    } catch (e: any) {
      console.error("[CHECKOUT] step=customer_create error", {
        message: e?.message,
        stack: e?.stack?.split("\n").slice(0, 3).join(" | "),
      });
      return Response.json(
        { success: false, step: "customer_create", error: "Payment setup failed — please try again" },
        { status: 500 }
      );
    }

    // Step 5 — success
    console.log("[CHECKOUT] step=complete ok", { customerId, priceId });
    return Response.json({ customerId, email: user.email, priceId });
  } catch (error: any) {
    console.error("[CHECKOUT] step=unknown error", {
      message: error?.message,
      stack: error?.stack?.split("\n").slice(0, 5).join(" | "),
    });
    return Response.json(
      { success: false, step: "unknown", error: "Internal server error" },
      { status: 500 }
    );
  }
}
