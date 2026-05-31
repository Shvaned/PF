import { getCurrentUser } from "@/lib/auth-helpers";
import { getOrGenerateChallenge, submitAnswer, skipChallenge, getStreak } from "@/lib/challenge";
import { logUsageAction } from "@/lib/usage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const challenge = await getOrGenerateChallenge(user.id);
    const streak = await getStreak(user.id);
    return Response.json({ challenge, streak });
  } catch (error: any) {
    console.error("[CHALLENGE] fetch_error", error?.message);
    return Response.json({ error: "Failed to load challenge" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const { challengeId, answerText } = await request.json();
    const result = await submitAnswer(challengeId, user.id, answerText);
    if (!result) return Response.json({ error: "Challenge not found" }, { status: 404 });
    logUsageAction(user.id, "challenge_completed");
    return Response.json(result);
  } catch (error: any) {
    console.error("[CHALLENGE] submit_error", error?.message);
    return Response.json({ error: "Failed to submit answer" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const { challengeId } = await request.json();
    await skipChallenge(challengeId, user.id);
    logUsageAction(user.id, "challenge_skipped");
    return Response.json({ skipped: true });
  } catch (error: any) {
    return Response.json({ error: "Failed to skip challenge" }, { status: 500 });
  }
}
