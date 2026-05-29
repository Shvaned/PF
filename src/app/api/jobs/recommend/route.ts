import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { extractProfile } from "@/lib/jobs/extraction";
import { buildCacheKey, buildSearchQueries } from "@/lib/jobs/normalization";
import { DEFAULT_QUERIES } from "@/lib/jobs/role-synonyms";
import { getOrCreateSession, replaceJobs, isInCooldown, recordSearchCall } from "@/lib/jobs/cache";
import { JSearchProvider } from "@/lib/jobs/jsearch";
import { rankJobs } from "@/lib/jobs/ranking";
import { deduplicateJobs } from "@/lib/jobs/deduplicate";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Job search not configured" }, { status: 500 });
  }

  // Parse filter overrides from request body
  let filterOverrides: { country?: string; city?: string; datePosted?: string; remoteMode?: string; employmentTypes?: string[] } = {};
  try {
    const body = await request.json().catch(() => ({}));
    filterOverrides = body || {};
  } catch {}

  console.log("[JOBS] filter_overrides", filterOverrides);

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

    // Apply filter overrides to profile
    if (filterOverrides.country) {
      profile.preferred_locations = [filterOverrides.country];
      if (filterOverrides.city) profile.preferred_locations.unshift(filterOverrides.city);
    }
    if (filterOverrides.remoteMode === "remote") profile.remote_ok = true;
    if (filterOverrides.remoteMode === "onsite") profile.remote_ok = false;

    console.log("[JOBS] location_detected", { locations: profile.preferred_locations });
    console.log("[JOBS] experience_level", { level: profile.experience_level });

    // Step 2: Normalize + cache key
    const cacheKey = buildCacheKey(profile);

    // Step 3: Cache check
    const { session, fresh } = await getOrCreateSession(user.id, resume.id, cacheKey, profile);

    // Cooldown check — if within 5 min, return cached jobs without calling JSearch
    const inCooldown = isInCooldown(user.id);
    if (inCooldown && session.jobs?.length > 0) {
      console.log("[JOBS] cooldown_return", { userId: user.id, jobCount: session.jobs.length });
      return Response.json({
        sessionId: session.id,
        jobs: session.jobs,
        fresh: true,
        cooldown: true,
        profile: {
          roles: profile.target_roles,
          skills: profile.skills.slice(0, 5),
          location: profile.preferred_locations?.[0] || null,
          experienceLevel: profile.experience_level,
        },
      });
    }

    if (fresh && !inCooldown) {
      console.log("[JOBS] cache_return", { sessionId: session.id, jobCount: session.jobs?.length || 0 });
      return Response.json({
        sessionId: session.id,
        jobs: session.jobs || [],
        fresh: true,
        profile: {
          roles: profile.target_roles,
          skills: profile.skills.slice(0, 5),
          location: profile.preferred_locations?.[0] || null,
          experienceLevel: profile.experience_level,
        },
      });
    }

    // Step 4: Tiered query strategy — stop when enough results found
    const allQueries = buildSearchQueries(profile);
    console.log("[JOBS] query_strategy", { tiers: allQueries.length, first: allQueries.slice(0, 5) });

    const provider = new JSearchProvider(apiKey);
    const results: any[] = [];
    let tier = 0;

    const jsearchParams: any = { page: 1, numPages: 2 };
    if (filterOverrides.datePosted) jsearchParams.datePosted = filterOverrides.datePosted;
    if (filterOverrides.employmentTypes?.length) jsearchParams.employmentTypes = filterOverrides.employmentTypes.join(",");

    for (const q of allQueries) {
      if (results.length >= 40) break;
      tier++;
      const jobs = await provider.searchJobs({ query: q, ...jsearchParams });
      console.log("[JOBS] query_result", { query: q, count: jobs.length, tier });
      results.push(...jobs);
      if (jobs.length === 0 && tier >= 6) {
        console.log("[JOBS] query_fallback", { query: q, totalSoFar: results.length });
      }
    }

    // Fallback: if still 0, try broad defaults
    if (results.length === 0) {
      console.log("[JSEARCH FALLBACK] all profile queries returned 0, trying defaults");
      for (const q of DEFAULT_QUERIES) {
        if (results.length >= 30) break;
        const jobs = await provider.searchJobs({ query: q, ...jsearchParams });
        console.log("[JOBS] query_result", { query: q, count: jobs.length, phase: "fallback" });
        results.push(...jobs);
      }
    }

    // Record the JSearch call timestamp
    recordSearchCall(user.id);

    console.log("[JOBS] pipeline", { stage: "raw", count: results.length });

    if (results.length === 0) {
      console.log("[JOBS] jsearch_empty", { userId: user.id, queries: allQueries.slice(0, 5) });
      return Response.json({
        sessionId: session.id,
        jobs: [],
        fresh: false,
        rawCount: 0,
        queries: allQueries.slice(0, 5),
      });
    }

    // Step 5: Merge new results with previous cached jobs, then deduplicate + rank
    const prevJobs = session.jobs || [];
    const merged = [...prevJobs, ...results];
    console.log("[JOBS] merge", { prev: prevJobs.length, new: results.length, merged: merged.length });

    const deduped = deduplicateJobs(merged);
    console.log("[JOBS] pipeline", { stage: "after_dedupe", count: deduped.length });

    const ranked = rankJobs({ jobs: deduped, profile });
    console.log("[JOBS] pipeline", { stage: "after_rank", count: ranked.length });

    console.log("[JOBS] scoring_result", {
      top: ranked.slice(0, 3).map((j: any) => ({ title: j.title, score: j.score, employer: j.employer })),
    });

    // Step 6: Attach search metadata to each job for client-side local filtering
    const searchMeta = {
      searchCountry: filterOverrides.country || profile.preferred_locations?.[0] || null,
      searchExperience: profile.experience_level,
      searchWorkMode: filterOverrides.remoteMode || "all",
      searchEmploymentTypes: filterOverrides.employmentTypes || [],
      searchTimestamp: Date.now(),
    };

    const topJobs = ranked.slice(0, 50).map((j: any) => ({
      ...j,
      searchMeta,
    }));

    // Save to DB (fire-and-forget — must not block response)
    replaceJobs(session.id, topJobs).catch((err: any) => {
      console.error("[JOBS] persist_async_failed", err?.message);
    });

    console.log("[JOBS] complete", { userId: user.id, raw: results.length, prev: prevJobs.length, deduped: deduped.length, ranked: ranked.length });

    return Response.json({
      sessionId: session.id,
      jobs: topJobs,
      fresh: false,
      rawCount: results.length,
      dedupedCount: deduped.length,
      mergedFromCache: prevJobs.length,
      profile: {
        roles: profile.target_roles,
        skills: profile.skills.slice(0, 5),
        location: profile.preferred_locations?.[0] || null,
        experienceLevel: profile.experience_level,
      },
    });
  } catch (error: any) {
    console.error("[JOBS] error", error?.message);
    return Response.json(
      { error: "Failed to generate recommendations. Please try again." },
      { status: 500 }
    );
  }
}
