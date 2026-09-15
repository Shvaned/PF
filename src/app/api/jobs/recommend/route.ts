import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { recommendFromPool } from "@/lib/jobs/serving";
import { replenishBucket } from "@/lib/jobs/ingest";

interface FilterOverrides {
  country?: string;
  city?: string;
  datePosted?: string;
  remoteMode?: string;
  employmentTypes?: string[];
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  let filterOverrides: FilterOverrides = {};
  try {
    const body = await request.json().catch(() => ({}));
    filterOverrides = body || {};
  } catch {}

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { selectedResumeId: true },
  });
  if (!dbUser?.selectedResumeId) {
    return Response.json({ error: "No resume selected. Select a resume first." }, { status: 400 });
  }

  const resume = await prisma.resume.findUnique({
    where: { id: dbUser.selectedResumeId },
  });
  if (!resume) {
    return Response.json({ error: "Selected resume not found" }, { status: 404 });
  }

  try {
    // Reuse the last extracted profile for this resume (avoids a fresh LLM call).
    const lastSession = await prisma.jobRecommendationSession.findFirst({
      where: { userId: user.id, resumeId: resume.id },
      orderBy: { refreshedAt: "desc" },
    });

    // Serving plane — reads the shared pool and ranks locally. Zero external calls.
    const result = await recommendFromPool({
      resume,
      existingExtractedData: lastSession?.extractedData || null,
      filterOverrides,
    });

    // Persist the per-user session pointer (Neon-safe findUnique → create/update).
    const existing = await prisma.jobRecommendationSession.findUnique({
      where: { userId_cacheKey: { userId: user.id, cacheKey: result.cacheKey } },
    });
    if (existing) {
      await prisma.jobRecommendationSession.update({
        where: { id: existing.id },
        data: {
          resumeId: resume.id,
          extractedData: JSON.stringify(result.profile),
          searchIntentId: result.intentId,
          refreshedAt: new Date(),
        },
      });
    } else {
      try {
        await prisma.jobRecommendationSession.create({
          data: {
            userId: user.id,
            resumeId: resume.id,
            cacheKey: result.cacheKey,
            extractedData: JSON.stringify(result.profile),
            searchIntentId: result.intentId,
          },
        });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;
      }
    }

    // Ingestion plane — fire-and-forget replenishment when the bucket is stale/thin.
    if (result.needsReplenishment) {
      void replenishBucket(
        {
          roleCategory: result.roleCategory,
          location: result.profile.preferred_locations?.[0],
          remote: result.profile.remote_ok,
        },
        "threshold",
      ).catch((e: any) => console.error("[JOBS] replenish_failed", e?.message));
    }

    return Response.json({
      jobs: result.jobs,
      profile: {
        roles: result.profile.target_roles,
        skills: result.profile.skills.slice(0, 5),
        location: result.profile.preferred_locations?.[0] || null,
        experienceLevel: result.profile.experience_level,
      },
      fresh: !result.stale,
      stale: result.stale,
      thin: result.thin,
      replenishing: result.needsReplenishment,
      temporarilyUnavailable: result.temporarilyUnavailable,
      rateLimited: result.temporarilyUnavailable,
    });
  } catch (error: any) {
    console.error("[JOBS] recommend_error", error?.message);
    return Response.json({ error: "Failed to load jobs. Please try again." }, { status: 500 });
  }
}
