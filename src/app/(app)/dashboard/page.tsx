import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkUsageLimit } from "@/lib/usage";
import Card, { CardIcon } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Suspense } from "react";
import DailyQuestion from "@/components/ui/DailyQuestion";
import CareerChecklist from "@/components/ui/CareerChecklist";
import AnswerTemplates from "@/components/ui/AnswerTemplates";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const { remaining, limit, allowed } = await checkUsageLimit(user.id);
  const isPremium = user.isPremium;

  const recentAnalysis = await prisma.analysis.findFirst({
    where: { userId: user.id! },
    orderBy: { createdAt: "desc" },
  });

  const totalAnalyses = await prisma.analysis.count({
    where: { userId: user.id! },
  });
  const showRepeatedUsagePromo = !isPremium && totalAnalyses >= 3;

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id! },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">
          Welcome back{ user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">Prepare for interviews faster.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {/* Analyze Resume Card */}
        <Card hover>
          <CardIcon gradient="linear-gradient(135deg, #60A5FA, #2563EB)">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </CardIcon>
          <h3 className="text-[16px] font-medium text-[#111827] mb-1">Analyze Resume</h3>
          <p className="text-sm text-[#6B7280] mb-4">Upload your resume and compare it with a job description</p>
          <Button href="/analyze">Start Analysis</Button>
        </Card>

        {/* Interview Prep Card */}
        <Card hover>
          <CardIcon gradient="linear-gradient(135deg, #4ADE80, #22C55E)">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </CardIcon>
          <h3 className="text-[16px] font-medium text-[#111827] mb-1">Interview Prep</h3>
          <p className="text-sm text-[#6B7280] mb-4">Get likely questions and answer guidance</p>
          {recentAnalysis ? (
            <Button href={`/prep/${recentAnalysis.id}`}>Start Prep</Button>
          ) : (
            <Button href="/analyze" variant="secondary">Analyze first</Button>
          )}
        </Card>

        {/* Mock Interview Card */}
        <Card hover>
          <CardIcon gradient="linear-gradient(135deg, #C084FC, #8B5CF6)">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </CardIcon>
          <h3 className="text-[16px] font-medium text-[#111827] mb-1">
            Mock Interview
            {!isPremium && <span className="text-[10px] font-medium ml-2 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">PRO</span>}
          </h3>
          <p className="text-sm text-[#6B7280] mb-4">Practice with AI and get feedback</p>
          {isPremium ? (
            <Button href="/mock-interview">Start Interview</Button>
          ) : (
            <Button href="/premium" variant="secondary">Upgrade to unlock</Button>
          )}
        </Card>
      </div>

      {/* Daily Question */}
      <div className="mb-6">
        <DailyQuestion roleCategory={recentAnalysis?.jobCategory || null} />
      </div>

      {/* Career Checklist + Answer Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <CareerChecklist />
        <AnswerTemplates />
      </div>

      {/* Bookmarked Questions */}
      {bookmarks.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Saved Questions</h3>
          <div className="space-y-2">
            {bookmarks.map((b) => (
              <div key={b.id} className="flex items-center gap-2 text-sm text-[#374151] py-1.5 px-3 bg-gray-50 rounded-[8px]">
                <svg className="w-4 h-4 text-[#2563EB] fill-[#2563EB] shrink-0" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="flex-1 truncate">{b.question}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Usage + Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Track your usage</h3>
          {isPremium ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Unlimited access — Premium
            </div>
          ) : (
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-[#6B7280]">Remaining today</span>
                <span className="font-medium text-[#111827]">{remaining} / {limit}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all"
                  style={{ width: `${((limit - remaining) / limit) * 100}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Quick tips</h3>
          <div className="space-y-2 text-sm text-[#6B7280]">
            <div className="flex gap-2">
              <span className="text-[#2563EB] shrink-0">1.</span>
              <span>Tailor your resume keywords to match the job description for higher match scores.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#2563EB] shrink-0">2.</span>
              <span>Practice behavioral questions using the STAR method (Situation, Task, Action, Result).</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#2563EB] shrink-0">3.</span>
              <span>Check your daily question to stay sharp and build confidence over time.</span>
            </div>
          </div>
        </Card>
      </div>

      {showRepeatedUsagePromo && (
        <Card className="mb-5 bg-gradient-to-r from-[#60A5FA]/5 to-[#2563EB]/5 border border-[#2563EB]/10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium text-[#111827]">You've been putting in the work</p>
              <p className="text-sm text-[#6B7280]">{totalAnalyses} analyses done. Unlock unlimited access and advanced mock interviews.</p>
            </div>
            <Button href="/premium">Upgrade to Premium</Button>
          </div>
        </Card>
      )}

      {/* Recent analysis */}
      <Suspense fallback={<SkeletonCard />}>
        {recentAnalysis && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-medium text-[#111827] mb-1">Latest Analysis</h3>
                <p className="text-xs text-[#9CA3AF]">
                  {new Date(recentAnalysis.createdAt).toLocaleDateString()} — Match: {recentAnalysis.matchScore}%
                </p>
              </div>
              <Button href={`/analyze/results/${recentAnalysis.id}`} variant="secondary">
                View Results
              </Button>
            </div>
          </Card>
        )}
      </Suspense>
    </div>
  );
}
