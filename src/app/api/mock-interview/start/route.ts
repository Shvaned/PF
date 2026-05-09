import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateMockQuestions } from "@/lib/ai";
import { logUsageAction } from "@/lib/usage";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Sign in to continue" }, { status: 401 });
    }

    const isPremium = user.isPremium;
    if (!isPremium) {
      return Response.json({ error: "Premium required. Upgrade to access mock interviews." }, { status: 403 });
    }

    const body = await request.json();
    const { analysisId, difficulty = "standard", questionTypes = "mixed", questionCount = 5 } = body;

    let resumeText = "";
    let jobDescription = "";

    if (analysisId) {
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        include: { resume: true, jobDescription: true },
      });

      if (analysis && analysis.userId === user.id) {
        resumeText = analysis.resume.content;
        jobDescription = analysis.jobDescription.content;
      }
    }

    if (!resumeText) {
      const latestResume = await prisma.resume.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      if (latestResume) resumeText = latestResume.content;
    }

    if (!jobDescription) {
      const latestJD = await prisma.jobDescription.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      if (latestJD) jobDescription = latestJD.content;
    }

    if (!resumeText || !jobDescription) {
      return Response.json(
        { error: "Please analyze your resume first before starting a mock interview." },
        { status: 400 }
      );
    }

    logUsageAction(user.id, "mock_interview_started");

    const questions = await generateMockQuestions({
      resumeText,
      jobDescription,
      difficulty,
      questionTypes,
      questionCount,
    });

    const interview = await prisma.mockInterview.create({
      data: {
        userId: user.id,
        difficulty,
        questionTypes,
        questionCount,
        questions: JSON.stringify(questions),
      },
    });

    return Response.json({ interviewId: interview.id });
  } catch (error: any) {
    console.error("Mock interview start error:", error);
    return Response.json(
      { error: error.message || "Failed to start interview." },
      { status: 500 }
    );
  }
}
