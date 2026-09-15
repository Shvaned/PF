import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getOrExtractProfile } from "@/lib/jobs/profile-cache";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

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

  try {
    const { profile, cached } = await getOrExtractProfile(resume, { force: forceRefresh });
    return Response.json({
      roles: profile.target_roles,
      skills: profile.skills.slice(0, 5),
      location: profile.preferred_locations?.[0] || null,
      experienceLevel: profile.experience_level,
      remote_ok: profile.remote_ok,
      cached,
      resumeId: resume.id,
    });
  } catch (error: any) {
    console.error("[JOBS] profile_extraction_failed", error?.message);
    return Response.json({ error: "Could not extract profile" }, { status: 500 });
  }
}
