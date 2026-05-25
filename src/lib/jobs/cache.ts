import { prisma } from "@/lib/prisma";

const FRESHNESS_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function getOrCreateSession(
  userId: string,
  resumeId: string,
  cacheKey: string,
  extractedData: any
) {
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

  const session = await prisma.jobRecommendationSession.upsert({
    where: { userId_cacheKey: { userId, cacheKey } },
    update: {
      resumeId,
      extractedData: JSON.stringify(extractedData),
      refreshedAt: new Date(),
    },
    create: {
      userId,
      resumeId,
      cacheKey,
      extractedData: JSON.stringify(extractedData),
    },
  });

  return { session: { ...session, jobs: existing?.jobs || [] }, fresh: false };
}

export async function replaceJobs(sessionId: string, jobs: any[]) {
  // Delete old jobs for this session
  await prisma.recommendedJob.deleteMany({ where: { sessionId } });

  // Insert new ones
  if (jobs.length > 0) {
    await prisma.recommendedJob.createMany({
      data: jobs.map((j) => ({
        sessionId,
        jobId: j.jobId,
        title: j.title,
        employer: j.employer,
        location: j.location,
        remote: j.remote,
        salary: j.salary,
        employmentType: j.employmentType,
        description: j.description?.slice(0, 5000) || null,
        shortDescription: j.shortDescription,
        applyUrl: j.applyUrl,
        source: j.source,
        datePosted: j.datePosted,
        score: j.score || 0,
        rawData: j.rawData ? JSON.stringify(j.rawData) : null,
      })),
    });
  }
}
