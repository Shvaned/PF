"use client";

const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";

interface CheckoutOptions {
  customerId: string;
  priceId: string;
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
  customerId,
  priceId,
  successUrl,
}: CheckoutOptions) {
  try {
    await loadPaddleScript();

    const Paddle = (window as any).Paddle;
    if (!Paddle?.Checkout) {
      throw new Error("Paddle checkout not available");
    }

    if (!initialized) {
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox";
      if (token) {
        Paddle.Initialize({ token, environment: env });
        console.log("[Paddle] Initialized", { environment: env, hasToken: !!token });
      } else {
        console.warn("[Paddle] No client token — checkout may fail");
      }
      initialized = true;
    }

    const url = successUrl || `${window.location.origin}/premium?checkout=success`;
    console.log("[Paddle] Opening checkout", { priceId, customerId, successUrl: url });

    Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { id: customerId },
      customData: { userId: customerId },
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl: url,
      },
    });
  } catch (error) {
    console.error("Paddle checkout error:", error);
    throw error;
  }
}
