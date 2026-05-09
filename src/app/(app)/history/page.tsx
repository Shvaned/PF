import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const isPremium = user.isPremium;
  const analyses = await prisma.analysis.findMany({
    where: { userId: user.id! },
    orderBy: { createdAt: "desc" },
    take: isPremium ? 50 : 3,
  });

  const mockInterviews = await prisma.mockInterview.findMany({
    where: { userId: user.id! },
    orderBy: { createdAt: "desc" },
    take: isPremium ? 50 : 3,
  });

  if (!analyses.length && !mockInterviews.length) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-[#111827]">History</h1>
        </div>
        <EmptyState
          title="No analyses yet"
          description="Start by uploading your resume and analyzing it against a job description."
          action={{ label: "Start Analysis", href: "/analyze" }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">History</h1>
        <p className="text-sm text-[#6B7280] mt-1">Your past analyses and interviews</p>
      </div>

      {analyses.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[16px] font-medium text-[#111827] mb-3">Resume Analyses</h2>
          <div className="space-y-2">
            {analyses.map((a) => (
              <Card key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111827]">
                    {a.jobCategory || "Analysis"} — Match: {a.matchScore}%
                  </p>
                  <p className="text-xs text-[#9CA3AF]">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <Button href={`/analyze/results/${a.id}`} variant="secondary" className="text-xs px-3 py-1.5">
                  View
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {mockInterviews.length > 0 && (
        <div>
          <h2 className="text-[16px] font-medium text-[#111827] mb-3">Mock Interviews</h2>
          <div className="space-y-2">
            {mockInterviews.map((mi) => (
              <Card key={mi.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111827] capitalize">
                    {mi.difficulty} — {mi.questionTypes}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {mi.status === "completed" ? "Completed" : "In progress"} • {new Date(mi.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {mi.status === "completed" ? (
                  <Button href={`/mock-interview/${mi.id}/report`} variant="secondary" className="text-xs px-3 py-1.5">
                    Report
                  </Button>
                ) : (
                  <Button href={`/mock-interview/${mi.id}`} variant="secondary" className="text-xs px-3 py-1.5">
                    Continue
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isPremium && analyses.length >= 3 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#60A5FA]/10 to-[#2563EB]/10 rounded-[16px] text-center">
          <p className="text-sm text-[#6B7280] mb-3">
            Free plan shows your 3 most recent analyses. Upgrade to see your full history.
          </p>
          <Button href="/premium">Upgrade to Premium</Button>
        </div>
      )}
    </div>
  );
}
