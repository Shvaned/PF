"use client";

const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";

interface CheckoutOptions {
  email?: string;
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
  email,
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
      if (token) {
        Paddle.Initialize({ token });
        console.log("[Paddle] Initialized", { hasToken: !!token, tokenPrefix: token.slice(0, 5) });
      } else {
        console.warn("[Paddle] No client token — checkout may fail");
      }
      initialized = true;
    }

    const url = successUrl || `${window.location.origin}/premium?checkout=success`;

    const payload: Record<string, any> = {
      items: [{ priceId, quantity: 1 }],
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl: url,
      },
    };

    // Only pass email for customer lookup — no stale customer IDs.
    // Paddle auto-creates/finds the customer by email.
    if (email) {
      payload.customer = { email };
    }

    console.log("[PADDLE_CHECKOUT_PAYLOAD]", { priceId, hasEmail: !!email, successUrl: url });

    Paddle.Checkout.open(payload);
  } catch (error) {
    console.error("Paddle checkout error:", error);
    throw error;
  }
}
