"use client";

const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";

interface CheckoutOptions {
  priceId: string;
  email?: string;
  userId?: string;
  successUrl?: string;
}

let paddleScriptPromise: Promise<void> | null = null;
let initialized = false;

function loadPaddleScript(): Promise<void> {
  if (paddleScriptPromise) return paddleScriptPromise;
  paddleScriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${PADDLE_JS}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = PADDLE_JS;
    script.onload = () => resolve();
    script.onerror = () => {
      paddleScriptPromise = null;
      reject(new Error("Failed to load Paddle checkout"));
    };
    document.head.appendChild(script);
  });
  return paddleScriptPromise;
}

export async function openPaddleCheckout({
  priceId,
  email,
  userId,
  successUrl,
}: CheckoutOptions) {
  await loadPaddleScript();

  const Paddle = (window as any).Paddle;
  if (!Paddle?.Checkout) {
    throw new Error("Paddle checkout not available");
  }

  if (!initialized) {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (token) {
      Paddle.Initialize({ token });
      console.log("[PADDLE] init ok", { hasToken: !!token });
    }
    initialized = true;
  }

  const url = successUrl || `${window.location.origin}/premium?checkout=success`;

  const payload: Record<string, any> = {
    items: [{ priceId, quantity: 1 }],
    settings: { displayMode: "overlay", theme: "light", successUrl: url },
  };

  if (email) payload.customer = { email };
  if (userId) payload.customData = { userId };

  console.log("[PADDLE] checkout open", { priceId, hasEmail: !!email, hasUserId: !!userId });

  Paddle.Checkout.open(payload);
}
