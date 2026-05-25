import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { extractProfile } from "@/lib/jobs/extraction";
import { buildCacheKey, buildSearchQueries } from "@/lib/jobs/normalization";
import { getOrCreateSession, replaceJobs } from "@/lib/jobs/cache";
import { JSearchProvider } from "@/lib/jobs/jsearch";
import { rankJobs } from "@/lib/jobs/ranking";
import { deduplicateJobs } from "@/lib/jobs/deduplicate";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Job search not configured" }, { status: 500 });
  }

  // Get user's selected resume
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
    // Step 1: Extract profile from resume
    console.log("[JOBS] extraction_start", { userId: user.id });
    const profile = await extractProfile(resume.content);
    console.log("[JOBS] extraction_ok", { roles: profile.target_roles, skills: profile.skills.length });

    // Step 2: Normalize + cache key
    const cacheKey = buildCacheKey(profile);

    // Step 3: Cache check
    const { session, fresh } = await getOrCreateSession(user.id, resume.id, cacheKey, profile);

    if (fresh) {
      console.log("[JOBS] cache_return", { sessionId: session.id, jobCount: session.jobs?.length || 0 });
      return Response.json({
        sessionId: session.id,
        jobs: session.jobs || [],
        fresh: true,
      });
    }

    // Step 4: Generate queries + search JSearch
    const queries = buildSearchQueries(profile);
    console.log("[JOBS] jsearch_start", { queries, userId: user.id });

    const provider = new JSearchProvider(apiKey);

    const results: any[] = [];
    for (const q of queries.slice(0, 2)) { // max 2 queries
      const jobs = await provider.searchJobs({
        query: q,
        page: 1,
        numPages: 2,
        datePosted: "month",
        employmentTypes: "FULLTIME;CONTRACTOR;PARTTIME;INTERN",
      });
      results.push(...jobs);
    }

    if (results.length === 0) {
      console.log("[JOBS] jsearch_empty", { userId: user.id });
      return Response.json({
        sessionId: session.id,
        jobs: [],
        fresh: false,
      });
    }

    // Step 5: Deduplicate + rank
    const deduped = deduplicateJobs(results);
    const ranked = rankJobs({ jobs: deduped, profile });

    // Step 6: Save to DB
    await replaceJobs(session.id, ranked.slice(0, 50));

    console.log("[JOBS] complete", { userId: user.id, total: results.length, deduped: deduped.length, ranked: ranked.length });

    return Response.json({
      sessionId: session.id,
      jobs: ranked.slice(0, 50),
      fresh: false,
    });
  } catch (error: any) {
    console.error("[JOBS] error", error?.message);
    return Response.json(
      { error: "Failed to generate recommendations. Please try again." },
      { status: 500 }
    );
  }
}
