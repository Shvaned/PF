import { prisma } from "@/lib/prisma";
import { getReadiness } from "@/lib/readiness";
import { getPerformanceData } from "@/lib/performance";
import { getActiveRoadmap } from "@/lib/roadmap";

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export async function getOrGenerateReport(userId: string) {
  const { start, end } = getWeekRange(new Date());

  // Check if report already generated this week
  const existing = await prisma.weeklyCareerReport.findUnique({
    where: { userId_weekStart: { userId, weekStart: start } },
  });
  if (existing) return existing;

  // Generate new report
  return generateReport(userId, start, end);
}

export async function generateReport(userId: string, weekStart: string, weekEnd: string) {
  console.log("[WEEKLY] generating", { userId, weekStart });

  // Gather current data
  const readiness = await getReadiness(userId);
  const perf = await getPerformanceData(userId);
  const roadmap = await getActiveRoadmap(userId);

  // Find previous week's report for delta
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const prevStart = lastWeekStart.toISOString().slice(0, 10);
  const prevReport = await prisma.weeklyCareerReport.findUnique({
    where: { userId_weekStart: { userId, weekStart: prevStart } },
  });

  const readinessBefore = prevReport?.readinessAfter || (readiness?.overallScore || 45) - 3;
  const readinessAfter = readiness?.overallScore || 45;

  // Count activities this week
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekEnd + "T23:59:59.999Z");

  const [mockCount, challengeCount, tailorCount] = await Promise.all([
    prisma.mockInterview.count({
      where: { userId, completedAt: { gte: weekStartDate, lte: weekEndDate } },
    }),
    prisma.dailyChallenge.count({
      where: { userId, completed: true, generatedDate: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.resume.count({
      where: { userId, createdAt: { gte: weekStartDate, lte: weekEndDate } },
    }),
  ]);

  // Job applications count (proxied by job recommendation sessions this week)
  const jobCount = await prisma.jobRecommendationSession.count({
    where: { userId, generatedAt: { gte: weekStartDate, lte: weekEndDate } },
  });

  // Compute deltas
  const atsDelta = readiness ? (readiness.atsScore - (prevReport ? 0 : readinessBefore)) : 0;
  const resumeDelta = readiness ? (readiness.resumeQualityScore - (prevReport ? 0 : readinessBefore)) : 0;
  const confidenceDelta = perf.current?.confidence
    ? Math.round(perf.current.confidence - (perf.previous7d?.confidence || perf.current.confidence - 5))
    : 0;

  // Build wins
  const wins: string[] = [];
  if (readinessAfter > readinessBefore) wins.push(`Recruiter readiness improved: ${readinessBefore} → ${readinessAfter}`);
  if (mockCount > 0) wins.push(`Completed ${mockCount} mock interview${mockCount > 1 ? "s" : ""}`);
  if (challengeCount > 0) wins.push(`Completed ${challengeCount} daily challenge${challengeCount > 1 ? "s" : ""}`);
  if (tailorCount > 1) wins.push("Created tailored resume versions");
  if (confidenceDelta > 3) wins.push(`Interview confidence improved by ${confidenceDelta}%`);
  if (wins.length === 0) wins.push("Started using PrepFit this week");

  // Focus areas from performance data
  const focusAreas = perf.weakestAreas?.slice(0, 3).map((k) => {
    const labels: Record<string, string> = {
      behavioral: "Behavioral storytelling",
      confidence: "Confidence building",
      technical: "Technical depth",
      communication: "Communication clarity",
      structure: "Answer structure",
      clarity: "Clear and concise responses",
      relevance: "Staying on topic",
    };
    return labels[k] || k;
  }) || ["Keep practicing consistently"];

  // Recommendations
  const recs: string[] = [];
  if (mockCount === 0) recs.push("Complete 1 mock interview this week");
  if (challengeCount < 3) recs.push("Try 2-3 daily challenges for consistent practice");
  if (roadmap) {
    const roadmapTasks = roadmap.tasks.filter((t) => !t.completed).slice(0, 2);
    recs.push(...roadmapTasks.map((t) => t.title));
  }
  if (recs.length === 0) recs.push("Keep up the great momentum");

  // Premium insights
  const premiumInsights = JSON.stringify({
    trend: `${readinessAfter > readinessBefore ? "Upward" : "Stable"} trajectory`,
    nextMilestone: Math.max(readinessAfter + 5, 70),
    estimatedWeeksToGoal: Math.ceil((80 - readinessAfter) / Math.max(readinessAfter - readinessBefore, 1)),
    recommendationDetail: "Focus on mock interviews and daily challenges for fastest readiness improvement.",
  });

  const report = await prisma.weeklyCareerReport.create({
    data: {
      userId,
      weekStart,
      weekEnd,
      readinessBefore: prevReport?.readinessAfter || readinessBefore,
      readinessAfter,
      interviewConfidenceDelta: confidenceDelta,
      resumeScoreDelta: resumeDelta,
      atsScoreDelta: atsDelta,
      mockCount,
      challengeCount,
      jobApplicationsCount: jobCount,
      resumeTailorsCount: tailorCount,
      wins: JSON.stringify(wins),
      focusAreas: JSON.stringify(focusAreas),
      recommendations: JSON.stringify(recs),
      premiumInsights,
    },
  });

  console.log("[WEEKLY] generated", { userId, readinessDelta: readinessAfter - readinessBefore });
  return report;
}

export async function getReportHistory(userId: string) {
  return prisma.weeklyCareerReport.findMany({
    where: { userId },
    orderBy: { weekStart: "desc" },
    take: 12,
  });
}
