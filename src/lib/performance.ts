import { prisma } from "@/lib/prisma";

const DIMENSIONS = [
  { key: "communication", label: "Communication", description: "Clarity and articulation in answers" },
  { key: "confidence", label: "Confidence", description: "Perceived confidence during responses" },
  { key: "behavioral", label: "Behavioral Answers", description: "Quality of behavioral/situational responses" },
  { key: "technical", label: "Technical Depth", description: "Technical accuracy and knowledge" },
  { key: "problemSolving", label: "Problem Solving", description: "Approach to solving presented problems" },
  { key: "structure", label: "Answer Structure", description: "Organization and flow of answers" },
  { key: "clarity", label: "Clarity", description: "Clear, concise communication" },
  { key: "relevance", label: "Relevance", description: "Staying on topic and answering the question" },
  { key: "leadership", label: "Leadership", description: "Ownership and initiative examples" },
  { key: "systemThinking", label: "System Thinking", description: "Big-picture architectural reasoning" },
] as const;

export type DimensionKey = typeof DIMENSIONS[number]["key"];

// ── Create snapshot from mock interview answers ──
export async function createSnapshot(
  userId: string,
  source: "mock_interview" | "prep" | "combined",
  sessionId?: string
) {
  // Gather all completed mock answers for this user
  const completedMockIds = (
    await prisma.mockInterview.findMany({
      where: { userId, status: "completed" },
      select: { id: true },
    })
  ).map((m) => m.id);

  const answers = completedMockIds.length > 0
    ? await prisma.mockAnswer.findMany({
        where: { mockInterviewId: { in: completedMockIds } },
        select: { scores: true, createdAt: true },
      })
    : [];

  if (answers.length === 0) {
    // Create a baseline empty snapshot
    await prisma.weakAreaSnapshot.create({
      data: {
        userId,
        source,
        sessionId,
        communicationScore: 45,
        confidenceScore: 45,
        behavioralScore: 45,
        technicalScore: 45,
        problemSolvingScore: 45,
        structureScore: 45,
        clarityScore: 45,
        relevanceScore: 45,
        leadershipScore: 45,
        systemThinkingScore: 45,
        overallInterviewScore: 45,
      },
    });
    return;
  }

  // Compute rolling averages with recency bias (last 7 answers weighted 2x)
  const scores = answers.map((a) => {
    const s = parseScores(a.scores);
    const daysAgo = (Date.now() - a.createdAt.getTime()) / 86400000;
    const recencyWeight = daysAgo < 7 ? 2 : 1;
    const dims = {
      communication: ((s?.clarity || 5) + (s?.structure || 5)) / 2 * 10, // clarity + structure → communication
      confidence: (s?.confidence || 5) * 10,
      behavioral: ((s?.clarity || 5) + (s?.confidence || 5)) / 2 * 10, // has elements of both
      technical: ((s?.relevance || 5) + (s?.structure || 5)) / 2 * 10, // relevance + structure → technical
      problemSolving: (s?.relevance || 5) * 10, // relevance ≈ problem fit
      structure: (s?.structure || 5) * 10,
      clarity: (s?.clarity || 5) * 10,
      relevance: (s?.relevance || 5) * 10,
      leadership: ((s?.confidence || 5) * 0.7 + (s?.clarity || 5) * 0.3) * 10, // confidence → partial leadership signal
      systemThinking: ((s?.relevance || 5) * 0.5 + (s?.structure || 5) * 0.5) * 10, // both contribute
    };
    return { dims, weight: recencyWeight };
  });

  // Weighted average per dimension
  const dims: Record<string, { sum: number; weight: number }> = {};
  for (const key of DIMENSIONS.map((d) => d.key)) dims[key] = { sum: 0, weight: 0 };
  for (const s of scores) {
    for (const key of DIMENSIONS.map((d) => d.key)) {
      dims[key].sum += s.dims[key] * s.weight;
      dims[key].weight += s.weight;
    }
  }

  const snapshot: Record<string, number> = {};
  let totalScore = 0;
  for (const key of DIMENSIONS.map((d) => d.key)) {
    const avg = dims[key].weight > 0 ? Math.round(dims[key].sum / dims[key].weight) : 45;
    snapshot[`${key}Score`] = clamp(avg);
    totalScore += avg;
  }
  const overallScore = Math.round(totalScore / DIMENSIONS.length);

  await prisma.weakAreaSnapshot.create({
    data: {
      userId,
      source: source as any,
      sessionId,
      communicationScore: snapshot.communicationScore,
      confidenceScore: snapshot.confidenceScore,
      behavioralScore: snapshot.behavioralScore,
      technicalScore: snapshot.technicalScore,
      problemSolvingScore: snapshot.problemSolvingScore,
      structureScore: snapshot.structureScore,
      clarityScore: snapshot.clarityScore,
      relevanceScore: snapshot.relevanceScore,
      leadershipScore: snapshot.leadershipScore,
      systemThinkingScore: snapshot.systemThinkingScore,
      overallInterviewScore: overallScore,
    },
  });
}

// ── Get latest heatmap data ──
export async function getPerformanceData(userId: string): Promise<{
  current: Record<string, number>;
  overallScore: number;
  previous7d: Record<string, number> | null;
  previous30d: Record<string, number> | null;
  allTime: Record<string, number> | null;
  snapshots: any[];
  strongestAreas: string[];
  weakestAreas: string[];
  recommendations: CoachingRecommendation[];
}> {
  const latest = await prisma.weakAreaSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return {
      current: baselineScores(),
      overallScore: 45,
      previous7d: null,
      previous30d: null,
      allTime: null,
      snapshots: [],
      strongestAreas: [],
      weakestAreas: [],
      recommendations: getRecommendations(baselineScores(), baselineScores()),
    };
  }

  const current = extractScores(latest);
  const allSnapshots = await prisma.weakAreaSnapshot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Trend windows
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const thirtyDaysAgo = now - 30 * 86400000;

  const snapshots7d = allSnapshots.filter((s) => s.createdAt.getTime() > sevenDaysAgo);
  const snapshots30d = allSnapshots.filter((s) => s.createdAt.getTime() > thirtyDaysAgo);

  const previous7d = snapshots7d.length > 1
    ? averageSnapshots(snapshots7d.slice(-3)) // earliest of last 3 in window
    : null;
  const previous30d = snapshots30d.length > 2
    ? averageSnapshots(snapshots30d.slice(-5))
    : null;
  const allTime = allSnapshots.length > 1
    ? averageSnapshots(allSnapshots)
    : null;

  // Sort dimensions by current score
  const ranked = DIMENSIONS
    .map((d) => ({ key: d.key, score: current[d.key] || 45 }))
    .sort((a, b) => b.score - a.score);

  const strongestAreas = ranked.slice(0, 3).map((r) => r.key);
  const weakestAreas = ranked.slice(-3).reverse().map((r) => r.key);

  // Compare against previous window for recommendations
  const previous = previous7d || current;

  return {
    current,
    overallScore: latest.overallInterviewScore,
    previous7d,
    previous30d,
    allTime,
    snapshots: allSnapshots.map((s) => ({
      ...extractScores(s),
      overallScore: s.overallInterviewScore,
      createdAt: s.createdAt,
    })),
    strongestAreas,
    weakestAreas,
    recommendations: getRecommendations(current, previous),
  };
}

// ── Coaching recommendations ──
export interface CoachingRecommendation {
  area: string;
  currentScore: number;
  change: number | null;
  suggestion: string;
  expectedGain: number;
}

function getRecommendations(current: Record<string, number>, previous: Record<string, number>): CoachingRecommendation[] {
  const recs: CoachingRecommendation[] = [];

  // Find declining or stagnant areas and suggest improvements
  const priority: { key: string; label: string; suggestion: string; gain: number }[] = [
    { key: "behavioral", label: "Behavioral Answers", suggestion: "Practice 2 mock interviews focusing on behavioral questions using the STAR method", gain: 6 },
    { key: "confidence", label: "Confidence", suggestion: "Record yourself answering questions to identify confidence gaps, then practice with a timer", gain: 5 },
    { key: "clarity", label: "Clarity", suggestion: "Practice giving answers in under 90 seconds — shorter, clearer responses score higher", gain: 4 },
    { key: "structure", label: "Answer Structure", suggestion: "Use the Situation-Task-Action-Result (STAR) framework for every behavioral answer", gain: 5 },
    { key: "technical", label: "Technical Depth", suggestion: "Review core technical concepts for your target role and practice explaining them aloud", gain: 4 },
    { key: "relevance", label: "Relevance", suggestion: "Always connect your answers back to the job description requirements", gain: 4 },
    { key: "communication", label: "Communication", suggestion: "Focus on eliminating filler words and speaking at a measured pace", gain: 4 },
    { key: "leadership", label: "Leadership", suggestion: "Prepare 2-3 specific examples where you took initiative or owned an outcome", gain: 3 },
    { key: "problemSolving", label: "Problem Solving", suggestion: "Practice breaking down technical problems out loud — walk through your reasoning", gain: 4 },
    { key: "systemThinking", label: "System Thinking", suggestion: "For architecture questions, always start with the big picture before diving into details", gain: 3 },
  ];

  for (const p of priority) {
    const curr = current[p.key] || 45;
    const prev = previous[p.key] || 45;
    const change = prev ? curr - prev : null;

    if (curr < 60) {
      recs.push({
        area: p.label,
        currentScore: curr,
        change,
        suggestion: p.suggestion,
        expectedGain: p.gain,
      });
    }
  }

  return recs.slice(0, 4);
}

// ── Helpers ──
function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function parseScores(raw: string | null): Record<string, number> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function baselineScores(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of DIMENSIONS) out[d.key] = 45;
  return out;
}

function extractScores(snapshot: any): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of DIMENSIONS) {
    const key = `${d.key}Score`;
    out[d.key] = snapshot[key] ?? 45;
  }
  return out;
}

function averageSnapshots(snapshots: any[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of DIMENSIONS) {
    const key = `${d.key}Score`;
    const sum = snapshots.reduce((acc, s) => acc + (s[key] || 45), 0);
    out[d.key] = Math.round(sum / snapshots.length);
  }
  return out;
}

export { DIMENSIONS };
