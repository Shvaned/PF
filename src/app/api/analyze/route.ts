import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { analyzeResumeAndJob } from "@/lib/ai";
import { checkUsageLimit, incrementUsage, logUsageAction } from "@/lib/usage";
import { validateResumeText, validateJobDescription, normalizeResumeText } from "@/lib/resume";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Sign in to continue" }, { status: 401 });
    }

    const { allowed, remaining } = await checkUsageLimit(user.id);
    if (!allowed) {
      return Response.json({
        error: "Daily limit of 3 analyses reached. Upgrade to Premium for unlimited analyses.",
        remaining,
      }, { status: 429 });
    }

    const body = await request.json();
    const { resumeText, jobDescription, roleCategory } = body;

    const resumeValidation = validateResumeText(resumeText || "");
    if (!resumeValidation.valid) {
      return Response.json({ error: resumeValidation.error }, { status: 400 });
    }

    const jobValidation = validateJobDescription(jobDescription || "");
    if (!jobValidation.valid) {
      return Response.json({ error: jobValidation.error }, { status: 400 });
    }

    const normalized = normalizeResumeText(resumeText);

    logUsageAction(user.id, "analysis_started");

    const result = await analyzeResumeAndJob({
      resumeText: normalized,
      jobDescription: jobDescription.trim(),
      roleCategory: roleCategory || "general",
    });

    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        resumeId: (
          await prisma.resume.create({
            data: { userId: user.id, content: normalized },
          })
        ).id,
        jobDescriptionId: (
          await prisma.jobDescription.create({
            data: { userId: user.id, content: jobDescription.trim(), category: result.jobCategory },
          })
        ).id,
        matchScore: result.matchScore,
        strengths: JSON.stringify(result.strengths),
        missingKeywords: JSON.stringify(result.missingKeywords),
        weakAreas: JSON.stringify(result.weakAreas),
        resumeImprovements: JSON.stringify(result.resumeImprovements),
        summary: result.summary,
        questions: JSON.stringify(result.questions),
        answerGuidance: JSON.stringify(result.answerGuidance),
        jobCategory: result.jobCategory,
      },
    });

    await incrementUsage(user.id);
    logUsageAction(user.id, "analysis_completed");

    return Response.json({ analysisId: analysis.id });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return Response.json(
      { error: error.message || "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
