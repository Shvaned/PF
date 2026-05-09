import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default async function PrepIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const analyses = await prisma.analysis.findMany({
    where: { userId: user.id! },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (!analyses.length) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-[#111827]">Interview Prep</h1>
        </div>
        <EmptyState
          title="No analyses yet"
          description="Analyze your resume first to get tailored interview questions and answer guidance."
          action={{ label: "Start Analysis", href: "/analyze" }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Interview Prep</h1>
        <p className="text-sm text-[#6B7280] mt-1">Choose an analysis to view interview questions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analyses.map((a) => (
          <Link key={a.id} href={`/prep/${a.id}`} className="block">
            <Card hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111827]">
                    {a.jobCategory || "Analysis"}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    Match: {a.matchScore}% • {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="secondary" className="text-xs px-3 py-1.5">
                  View Prep
                </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
