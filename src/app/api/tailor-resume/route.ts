import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/tailor-resume";
import { logUsageAction } from "@/lib/usage";
import type { TailorMode } from "@/lib/tailor-resume";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const body = await request.json();
    const { resumeId, jobDescription, jobTitle, companyName, mode = "ats" as TailorMode, atsGaps, strengths } = body;

    // Get the resume
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== user.id) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    logUsageAction(user.id, "tailor_resume_started");

    const result = await tailorResume({
      resumeText: resume.content,
      jobDescription,
      jobTitle,
      companyName,
      mode,
      atsGaps,
      strengths,
    });

    // Save the tailored version as a new resume variant
    const label = companyName
      ? `${resume.resumeLabel || resume.title} — ${companyName}`
      : `${resume.resumeLabel || resume.title} — Tailored`;

    const tailoredVersion = await prisma.resume.create({
      data: {
        userId: user.id,
        title: `${resume.title} (Tailored)`,
        content: result.tailoredResume,
        uploadType: "paste",
        resumeLabel: label,
        resumeType: resume.resumeType || "custom",
      },
    });

    logUsageAction(user.id, "tailor_resume_completed");

    return Response.json({
      ...result,
      resumeId: tailoredVersion.id,
    });
  } catch (error: any) {
    console.error("[TAILOR] error", error?.message);
    return Response.json({ error: error?.message || "Tailoring failed" }, { status: 500 });
  }
}
