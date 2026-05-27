import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import QuestionAccordion from "@/components/interview/QuestionAccordion";
import PremiumGate from "@/components/ui/PremiumGate";

const VISIBLE_COUNT = 4;

export default async function PrepPage({ params }: { params: Promise<{ analysisId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const { analysisId } = await params;
  const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
  if (!analysis || analysis.userId !== user.id) {
    redirect("/dashboard");
  }

  const parsedQuestions = JSON.parse(analysis.questions);
  const parsedGuidance = JSON.parse(analysis.answerGuidance);

  // Defensive normalization — LLM output may vary in structure
  const questions = Array.isArray(parsedQuestions) ? parsedQuestions : [];
  const guidance = Array.isArray(parsedGuidance) ? parsedGuidance : [];

  const isPremium = user.isPremium;

  const visibleQuestions = isPremium ? questions : questions.slice(0, VISIBLE_COUNT);
  const visibleGuidance = isPremium ? guidance : guidance.filter((g: any) => {
    const idx = questions.findIndex((q: any) => q.id === g.questionId);
    return idx < VISIBLE_COUNT;
  });
  const lockedQuestions = questions.slice(VISIBLE_COUNT);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Interview Prep</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {questions.length} questions • Match: {analysis.matchScore}%
          </p>
        </div>
        {isPremium && (
          <Button href={`/mock-interview?analysisId=${analysisId}`}>
            Start Mock Interview
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Likely Interview Questions</h3>
        <p className="text-sm text-[#6B7280] mb-4">
          These questions are tailored to your resume and the job description. Click to expand answer guidance.
        </p>
        <QuestionAccordion questions={visibleQuestions} guidance={visibleGuidance} />

        {!isPremium && lockedQuestions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <p className="text-sm font-medium text-[#6B7280] mb-4">
              {lockedQuestions.length} more questions available
            </p>
            <PremiumGate
              title="Unlock Mock Interviews"
              description="Practice AI interviews and receive proper feedback, track your weak areas, and get a final report."
              blurContent={
                <div className="space-y-2">
                  {lockedQuestions.map((q: any) => (
                    <div
                      key={q.id}
                      className="bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-3.5 flex items-center gap-3"
                    >
                      <span className="text-[10px] font-medium text-gray-400">●</span>
                      <span className="flex-1 text-sm text-[#111827]">{q.question}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {q.type}
                      </span>
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        )}
      </Card>

      {isPremium && (
        <div className="mt-6 flex gap-3">
          <Button href={`/analyze/results/${analysisId}`} variant="secondary">
            Back to Results
          </Button>
          <Button href={`/mock-interview?analysisId=${analysisId}`}>
            Practice Mock Interview
          </Button>
        </div>
      )}

      {!isPremium && (
        <div className="mt-6">
          <Button href={`/analyze/results/${analysisId}`} variant="secondary">
            Back to Results
          </Button>
        </div>
      )}
    </div>
  );
}
