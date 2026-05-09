import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, userId, metadata, timestamp } = body;

    // In production, send to your analytics provider (PostHog, Mixpanel, etc.)
    // For MVP, just log to console
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics Event] ${event}`, { userId, metadata, timestamp });
    }

    return Response.json({ received: true });
  } catch {
    return Response.json({ received: true }); // Always succeed silently
  }
}
