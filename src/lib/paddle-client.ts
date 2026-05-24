"use client";

const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";

let scriptPromise: Promise<void> | null = null;
let initDone = false;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${PADDLE_JS}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = PADDLE_JS;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("Paddle script failed")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export async function openPaddleCheckout(params: {
  priceId: string;
  userId: string;
  email?: string;
  successUrl?: string;
}) {
  const { priceId, userId, email, successUrl } = params;
  await loadScript();

  const Paddle = (window as any).Paddle;
  if (!Paddle?.Checkout) throw new Error("Paddle not available");

  if (!initDone) {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox";
    Paddle.Initialize({ token, environment: env });
    initDone = true;
    console.log("[PADDLE] init", { env, hasToken: !!token });
  }

  const payload: Record<string, any> = {
    items: [{ priceId, quantity: 1 }],
    customData: { userId },
    settings: {
      displayMode: "overlay",
      theme: "light",
      successUrl: successUrl || `${window.location.origin}/premium?checkout=success`,
    },
  };
  if (email) payload.customer = { email };

  console.log("[PADDLE] checkout_open", { priceId, hasEmail: !!email });
  Paddle.Checkout.open(payload);
}
