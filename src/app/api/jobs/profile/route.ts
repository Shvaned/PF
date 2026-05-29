import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { extractProfile } from "@/lib/jobs/extraction";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

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
    const profile = await extractProfile(resume.content);
    return Response.json({
      roles: profile.target_roles,
      skills: profile.skills.slice(0, 5),
      location: profile.preferred_locations?.[0] || null,
      experienceLevel: profile.experience_level,
      remote_ok: profile.remote_ok,
    });
  } catch (error: any) {
    console.error("[JOBS] profile_extraction_failed", error?.message);
    return Response.json(
      { error: "Could not extract profile" },
      { status: 500 }
    );
  }
}
