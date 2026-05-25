import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    console.error("[LS] missing_env", { hasKey: !!apiKey, hasStore: !!storeId, hasVariant: !!variantId });
    return Response.json({ ok: false, error: "Checkout not configured" }, { status: 500 });
  }

  const { successUrl, cancelUrl } = await request.json().catch(() => ({}));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        product_options: {
          redirect_url: successUrl || `${appUrl}/premium?checkout=success`,
          enabled_variants: [Number(variantId)],
        },
        checkout_data: {
          custom: { user_id: user.id },
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  };

  console.log("[LS] create_checkout", { storeId, variantId, userId: user.id });

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error("[LS] create_checkout error", { status: res.status, body: JSON.stringify(json).slice(0, 500) });
    return Response.json({ ok: false, error: "Failed to create checkout" }, { status: 500 });
  }

  const url = json?.data?.attributes?.url;
  if (!url) {
    console.error("[LS] create_checkout no_url", { response: JSON.stringify(json).slice(0, 300) });
    return Response.json({ ok: false, error: "No checkout URL" }, { status: 500 });
  }

  console.log("[LS] create_checkout ok", { url });
  return Response.json({ ok: true, url });
}
