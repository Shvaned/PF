import { getCurrentUser } from "@/lib/auth-helpers";
import { computeAndStoreReadiness, getReadiness } from "@/lib/readiness";
import { logUsageAction } from "@/lib/usage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  try {
    let readiness = await getReadiness(user.id);

    // Auto-calculate if never calculated
    if (!readiness) {
      const result = await computeAndStoreReadiness(user.id);
      readiness = await getReadiness(user.id);
    }

    return Response.json({
      ...readiness,
      strengths: readiness?.strengths ? JSON.parse(readiness.strengths) : [],
      weaknesses: readiness?.weaknesses ? JSON.parse(readiness.weaknesses) : [],
    });
  } catch (error: any) {
    console.error("[READINESS] fetch_error", error?.message);
    return Response.json({ error: "Failed to load readiness data" }, { status: 500 });
  }
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  try {
    logUsageAction(user.id, "readiness_recalculated");
    const result = await computeAndStoreReadiness(user.id);

    return Response.json({
      ...result,
    });
  } catch (error: any) {
    console.error("[READINESS] recalc_error", error?.message);
    return Response.json({ error: "Failed to calculate readiness" }, { status: 500 });
  }
}
