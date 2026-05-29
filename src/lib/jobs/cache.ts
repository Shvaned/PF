import { prisma } from "@/lib/prisma";

const FRESHNESS_MS = 12 * 60 * 60 * 1000; // 12 hours
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes — invisible JSearch throttle

// In-memory cooldown tracker (per-user last JSearch call timestamp)
const cooldownMap = new Map<string, number>();

export function isInCooldown(userId: string): boolean {
  const lastCall = cooldownMap.get(userId);
  if (!lastCall) return false;
  return Date.now() - lastCall < COOLDOWN_MS;
}

export function recordSearchCall(userId: string): void {
  cooldownMap.set(userId, Date.now());
}

/** Returns ms remaining in cooldown, or 0 if ready */
export function cooldownRemainingMs(userId: string): number {
  const lastCall = cooldownMap.get(userId);
  if (!lastCall) return 0;
  const remaining = COOLDOWN_MS - (Date.now() - lastCall);
  return Math.max(0, remaining);
}

export async function getOrCreateSession(
  userId: string,
  resumeId: string,
  cacheKey: string,
  extractedData: any
) {
  try {
    const existing = await prisma.jobRecommendationSession.findUnique({
      where: { userId_cacheKey: { userId, cacheKey } },
      include: { jobs: true },
    });

    if (existing) {
      const age = Date.now() - existing.generatedAt.getTime();
      if (age < FRESHNESS_MS) {
        console.log("[JOBS] cache_hit", { userId, cacheKey, age: Math.round(age / 3600000) + "h" });
        return { session: existing, fresh: true };
      }
      console.log("[JOBS] cache_stale", { userId, cacheKey });
    }

    let session;
    if (existing) {
      session = await prisma.jobRecommendationSession.update({
        where: { userId_cacheKey: { userId, cacheKey } },
        data: {
          resumeId,
          extractedData: JSON.stringify(extractedData),
          refreshedAt: new Date(),
        },
      });
    } else {
      try {
        session = await prisma.jobRecommendationSession.create({
          data: {
            userId,
            resumeId,
            cacheKey,
            extractedData: JSON.stringify(extractedData),
          },
        });
      } catch (createErr: any) {
        if (createErr?.code === "P2002") {
          session = await prisma.jobRecommendationSession.findUniqueOrThrow({
            where: { userId_cacheKey: { userId, cacheKey } },
          });
        } else {
          throw createErr;
        }
      }
    }

    return { session: { ...session, jobs: existing?.jobs || [] }, fresh: false };
  } catch (err: any) {
    console.error("[JOBS] session_failed", err?.message);
    return {
      session: { id: "", jobs: [] },
      fresh: false,
      sessionFailed: true,
    };
  }
}

export async function replaceJobs(sessionId: string, jobs: any[]) {
  if (!sessionId || jobs.length === 0) return;

  console.log("[JOBS] persist_start", { sessionId, count: jobs.length });

  try {
    await prisma.recommendedJob.deleteMany({ where: { sessionId } });
    console.log("[JOBS] persist_deleted", { sessionId });

    const batchSize = 10;
    let inserted = 0;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      await Promise.all(
        batch.map((j) =>
          prisma.recommendedJob.create({
            data: {
              sessionId,
              jobId: j.jobId || "",
              title: j.title || "Untitled",
              employer: j.employer || "Unknown",
              location: j.location || "Remote",
              remote: j.remote ?? false,
              salary: typeof j.salary === "string" ? j.salary : null,
              employmentType: j.employmentType || null,
              description: j.description?.slice(0, 5000) || null,
              shortDescription: j.shortDescription || null,
              applyUrl: j.applyUrl || null,
              source: j.source || "jsearch",
              datePosted: j.datePosted || null,
              score: j.score || 0,
              rawData: j.rawData ? JSON.stringify(j.rawData) : null,
            },
          })
        )
      );
      inserted += batch.length;
    }

    console.log("[JOBS] persist_success", { sessionId, inserted });
  } catch (err: any) {
    console.error("[JOBS] persist_failed", {
      sessionId,
      error: err?.message,
      code: err?.code,
    });
  }
}
