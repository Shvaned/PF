import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import MatchScore from "@/components/ui/MatchScore";
import Button from "@/components/ui/Button";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const { id } = await params;
  const analysis = await prisma.analysis.findUnique({ where: { id } });
  if (!analysis || analysis.userId !== user.id) {
    redirect("/dashboard");
  }

  const strengths = JSON.parse(analysis.strengths) as string[];
  const missingKeywords = JSON.parse(analysis.missingKeywords) as string[];
  const weakAreas = JSON.parse(analysis.weakAreas) as string[];
  const resumeImprovements = JSON.parse(analysis.resumeImprovements) as string[];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Analysis Results</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          {analysis.jobCategory ? `${analysis.jobCategory} • ` : ""}
          {new Date(analysis.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Match Score */}
      <Card className="mb-6">
        <MatchScore score={analysis.matchScore} />
        <p className="text-sm text-[#6B7280] mt-3">{analysis.summary}</p>
      </Card>

      {/* Resume Strength Snapshot */}
      <Card className="mb-6 bg-gradient-to-r from-[#EFF6FF] to-[#F5F3FF] border border-[#2563EB]/10">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Resume Strength Snapshot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">Top 3 Strengths</p>
            <ul className="space-y-1.5">
              {strengths.slice(0, 3).map((s: string, i: number) => (
                <li key={i} className="text-sm text-[#374151] flex gap-2">
                  <span className="text-green-500 shrink-0">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-2">Top 3 Fixes</p>
            <ul className="space-y-1.5">
              {resumeImprovements.slice(0, 3).map((r: string, i: number) => (
                <li key={i} className="text-sm text-[#374151] flex gap-2">
                  <span className="text-[#2563EB] shrink-0">{i + 1}</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Strengths
          </h3>
          <div className="flex flex-wrap gap-2">
            {strengths.map((s, i) => (
              <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">{s}</span>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Weak Areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {weakAreas.map((w, i) => (
              <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full">{w}</span>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Missing Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map((k, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-[#6B7280] text-sm rounded-full">{k}</span>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Resume Suggestions</h3>
          <ul className="space-y-2">
            {resumeImprovements.map((r, i) => (
              <li key={i} className="text-sm text-[#6B7280] flex gap-2">
                <span className="text-[#2563EB] shrink-0">•</span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <Button href={`/prep/${analysis.id}`}>
          Start Interview Prep
        </Button>
        <Button href="/analyze" variant="secondary">
          New Analysis
        </Button>
      </div>
    </div>
  );
}
