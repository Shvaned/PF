import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FeedbackCard from "@/components/interview/FeedbackCard";

export default async function MockReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const { id } = await params;
  const interview = await prisma.mockInterview.findUnique({ where: { id } });
  if (!interview || interview.userId !== user.id) redirect("/mock-interview");

  const scores = interview.scores ? JSON.parse(interview.scores) : null;
  const feedback = interview.feedback ? JSON.parse(interview.feedback) : null;
  const answers = await prisma.mockAnswer.findMany({
    where: { mockInterviewId: id },
    orderBy: { createdAt: "asc" },
  });

  // Fetch accumulated weak areas across sessions for trend display
  const accumulatedWeakAreas = await prisma.weakArea.findMany({
    where: { userId: user.id! },
    orderBy: { count: "desc" },
    take: 6,
  });
  const recurringPatterns = accumulatedWeakAreas.filter((w) => w.count > 1);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Interview Report</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          {interview.difficulty} • {answers.length} questions answered
        </p>
      </div>

      {scores && (
        <>
          <Card className="mb-6">
            <h3 className="text-[16px] font-medium text-[#111827] mb-4">Overall Score</h3>
            <div className="text-4xl font-bold text-[#111827] mb-2">{scores.overallScore}%</div>
            <p className="text-sm text-[#6B7280]">
              Strongest: <span className="text-green-600 font-medium">{scores.strongestArea}</span>
              {" • "}
              Weakest: <span className="text-orange-600 font-medium">{scores.weakestArea}</span>
            </p>
          </Card>

          <Card className="mb-6">
            <h3 className="text-[16px] font-medium text-[#111827] mb-4">Category Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {scores.categoryScores?.map((cat: { name: string; score: number }) => (
                <FeedbackCard key={cat.name} label={cat.name} score={cat.score} />
              ))}
            </div>
          </Card>

          {recurringPatterns.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-[16px] font-medium text-[#111827] mb-3">Trends Across Sessions</h3>
              <p className="text-xs text-[#9CA3AF] mb-3">Patterns we've noticed over multiple practice sessions</p>
              <div className="space-y-3">
                {recurringPatterns.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-[10px]">
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{w.area}</p>
                      <p className="text-xs text-[#6B7280]">
                        {w.category} &middot; seen {w.count} time{w.count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                      {w.count}x
                    </span>
                  </div>
                ))}
              </div>
              {recurringPatterns.length > 0 && (
                <p className="mt-3 text-sm text-[#6B7280]">
                  You consistently struggle with{" "}
                  <span className="font-medium text-[#111827]">{recurringPatterns[0].area.toLowerCase()}</span>
                  . Focus on this area in your next practice session.
                </p>
              )}
            </Card>
          )}

          {feedback?.recurringWeakAreas?.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-[16px] font-medium text-[#111827] mb-3">Recurring Weak Areas</h3>
              <div className="flex flex-wrap gap-2">
                {feedback.recurringWeakAreas.map((w: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full">{w}</span>
                ))}
              </div>
            </Card>
          )}

          {feedback?.improvementTips?.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-[16px] font-medium text-[#111827] mb-3">Improvement Tips</h3>
              <ul className="space-y-2">
                {feedback.improvementTips.map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-[#6B7280] flex gap-2">
                    <span className="text-[#2563EB]">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="mb-6">
            <h3 className="text-[16px] font-medium text-[#111827] mb-3">Next Steps</h3>
            <p className="text-sm text-[#6B7280]">{feedback?.nextStep || "Keep practicing to improve your interview skills."}</p>
          </Card>
        </>
      )}

      <div className="flex gap-3">
        <Button href="/mock-interview">New Mock Interview</Button>
        <Button href="/dashboard" variant="secondary">Back to Dashboard</Button>
      </div>
    </div>
  );
}
