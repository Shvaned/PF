import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateReportPDF } from "@/lib/pdf";
import { logUsageAction } from "@/lib/usage";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPremium = user.isPremium;
    if (!isPremium) {
      return Response.json({ error: "Premium required" }, { status: 403 });
    }

    const { analysisId } = await params;
    const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
    if (!analysis || analysis.userId !== user.id) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const pdf = await generateReportPDF({
      matchScore: analysis.matchScore,
      strengths: JSON.parse(analysis.strengths),
      missingKeywords: JSON.parse(analysis.missingKeywords),
      weakAreas: JSON.parse(analysis.weakAreas),
      resumeImprovements: JSON.parse(analysis.resumeImprovements),
      summary: analysis.summary,
      questions: JSON.parse(analysis.questions),
      guidance: JSON.parse(analysis.answerGuidance),
      jobCategory: analysis.jobCategory || undefined,
    });

    logUsageAction(user.id, "pdf_export");

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="prepfit-report-${analysisId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF export error:", error);
    return Response.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
