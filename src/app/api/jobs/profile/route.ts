import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { extractProfile } from "@/lib/jobs/extraction";

// In-memory profile cache: key = `${resumeId}-${updatedAt}`
const cache = new Map<string, { data: any; at: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  // Allow force-refresh via query param
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "true";

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { selectedResumeId: true },
  });
  if (!dbUser?.selectedResumeId) {
    return Response.json({ error: "No resume selected" }, { status: 400 });
  }

  const resume = await prisma.resume.findUnique({
    where: { id: dbUser.selectedResumeId },
  });
  if (!resume) {
    return Response.json({ error: "Resume not found" }, { status: 404 });
  }

  // Cache key: resumeId + updatedAt
  const cacheKey = `${resume.id}-${resume.updatedAt?.getTime() || resume.createdAt.getTime()}`;
  const cached = cache.get(cacheKey);

  if (cached && !forceRefresh && Date.now() - cached.at < CACHE_TTL) {
    console.log("[JOBS] profile_cache_hit", { cacheKey });
    return Response.json({ ...cached.data, cached: true });
  }

  console.log("[JOBS] profile_extraction", { cacheKey, force: forceRefresh });
  try {
    const profile = await extractProfile(resume.content);
    const data = {
      roles: profile.target_roles,
      skills: profile.skills.slice(0, 5),
      location: profile.preferred_locations?.[0] || null,
      experienceLevel: profile.experience_level,
      remote_ok: profile.remote_ok,
      cached: false,
      resumeId: resume.id,
    };
    cache.set(cacheKey, { data, at: Date.now() });
    return Response.json(data);
  } catch (error: any) {
    console.error("[JOBS] profile_extraction_failed", error?.message);
    return Response.json(
      { error: "Could not extract profile" },
      { status: 500 }
    );
  }
}
