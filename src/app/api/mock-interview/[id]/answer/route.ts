import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { evaluateAnswer, generateFinalReport } from "@/lib/ai";
import { logUsageAction } from "@/lib/usage";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const interview = await prisma.mockInterview.findUnique({ where: { id } });
  if (!interview || interview.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    questions: interview.questions,
    currentIndex: interview.currentIndex,
    status: interview.status,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const interview = await prisma.mockInterview.findUnique({ where: { id } });
    if (!interview || interview.userId !== user.id) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { question, answer } = body;

    // Get resume and job description for context
    const latestResume = await prisma.resume.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const latestJD = await prisma.jobDescription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const evaluation = await evaluateAnswer({
      question,
      userAnswer: answer,
      resumeText: latestResume?.content || "",
      jobDescription: latestJD?.content || "",
    });

    await prisma.mockAnswer.create({
      data: {
        mockInterviewId: id,
        question,
        userAnswer: answer,
        feedback: evaluation.feedback,
        scores: JSON.stringify({
          clarity: evaluation.clarity,
          relevance: evaluation.relevance,
          confidence: evaluation.confidence,
          structure: evaluation.structure,
        }),
      },
    });

    // Update current index
    await prisma.mockInterview.update({
      where: { id },
      data: { currentIndex: { increment: 1 } },
    });

    return Response.json(evaluation);
  } catch (error: any) {
    console.error("Answer eval error:", error);
    return Response.json(
      { error: error.message || "Evaluation failed" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const interview = await prisma.mockInterview.findUnique({
      where: { id },
      include: { answers: true },
    });
    if (!interview || interview.userId !== user.id) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { messages } = body;

    const userMessages = messages.filter((m: any) => m.role === "user");
    const aiMessages = messages.filter((m: any) => m.role === "ai" && m.content);

    // Build results for final report
    const questions = JSON.parse(interview.questions);
    const answers = interview.answers.map((a) => a.userAnswer);
    const scores = interview.answers.map((a) =>
      a.scores ? JSON.parse(a.scores) : {}
    );

    const report = await generateFinalReport({
      questions: questions.map((q: any) => q.question),
      answers,
      scores,
    });

    // Track weak areas
    for (const area of report.recurringWeakAreas) {
      const existing = await prisma.weakArea.findFirst({
        where: { userId: user.id, area },
      });

      if (existing) {
        await prisma.weakArea.update({
          where: { id: existing.id },
          data: { count: { increment: 1 }, lastSeen: new Date() },
        });
      } else {
        await prisma.weakArea.create({
          data: {
            userId: user.id,
            area,
            category: report.weakestArea,
          },
        });
      }
    }

    await prisma.mockInterview.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
        scores: JSON.stringify({
          overallScore: report.overallScore,
          strongestArea: report.strongestArea,
          weakestArea: report.weakestArea,
          categoryScores: report.categoryScores,
        }),
        feedback: JSON.stringify({
          recurringWeakAreas: report.recurringWeakAreas,
          improvementTips: report.improvementTips,
          nextStep: report.nextStep,
        }),
      },
    });

    logUsageAction(user.id, "mock_interview_completed");

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Report generation error:", error);
    return Response.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
