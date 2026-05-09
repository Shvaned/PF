type AnalyticsEvent =
  | "onboarding_completed"
  | "resume_upload"
  | "pdf_parse_started"
  | "pdf_parse_succeeded"
  | "analysis_started"
  | "analysis_completed"
  | "interview_prep_opened"
  | "mock_interview_started"
  | "mock_interview_completed"
  | "premium_card_viewed"
  | "premium_clicked"
  | "paywall_viewed"
  | "upgrade_completed"
  | "pdf_export_clicked";

interface EventData {
  userId?: string;
  metadata?: Record<string, string | number>;
}

export function trackEvent(event: AnalyticsEvent, data?: EventData) {
  if (typeof window === "undefined") return;

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, data);
  }

  // In production, send to an analytics service
  // For MVP, we use a simple fetch to our own endpoint
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...data, timestamp: Date.now() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics should never break the app
  }
}

// Track page views
export function trackPageView(page: string, userId?: string) {
  trackEvent("onboarding_completed", {
    userId,
    metadata: { page },
  });
}
