import { prisma } from "@/lib/prisma";

interface ReadinessInput {
  userId: string;
  latestAnalysis: {
    matchScore: number;
    strengths: string;     // JSON string[]
    missingKeywords: string; // JSON string[]
    weakAreas: string;     // JSON string[]
    resumeImprovements: string; // JSON string[]
  } | null;
  completedMocks: {
    scores: string | null; // JSON { categoryScores, overallScore }
  }[];
  mockAnswers: {
    scores: string | null; // JSON { clarity, relevance, confidence, structure }
  }[];
  questions: string[];
  skillCount: number;
  hasResume: boolean;
}

interface ReadinessResult {
  overallScore: number;
  resumeQualityScore: number;
  atsScore: number;
  interviewReadinessScore: number;
  behavioralConfidenceScore: number;
  technicalReadinessScore: number;
  marketCompetitivenessScore: number;
  level: "beginner" | "developing" | "competitive" | "interview-ready";
  strengths: string[];
  weaknesses: string[];
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function getLevel(score: number): ReadinessResult["level"] {
  if (score >= 81) return "interview-ready";
  if (score >= 61) return "competitive";
  if (score >= 41) return "developing";
  return "beginner";
}

function parseJSONArray(val: string | null | undefined): any[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function calculateReadiness(input: ReadinessInput): ReadinessResult {
  // ── Resume Quality (0-100, weight 20%) ──
  let resumeQualityScore = 50;
  if (input.latestAnalysis) {
    const a = input.latestAnalysis;
    resumeQualityScore += (a.matchScore / 100) * 30;
    resumeQualityScore += Math.min(parseJSONArray(a.strengths).length * 5, 15);
    resumeQualityScore -= Math.min(parseJSONArray(a.resumeImprovements).length * 5, 15);
  }
  resumeQualityScore = clamp(resumeQualityScore);

  // ── ATS Optimization (0-100, weight 15%) ──
  let atsScore = 40;
  if (input.latestAnalysis) {
    const a = input.latestAnalysis;
    atsScore += (a.matchScore / 100) * 30;
    atsScore -= Math.min(parseJSONArray(a.missingKeywords).length * 5, 30);
  }
  atsScore = clamp(atsScore);

  // ── Interview Readiness (0-100, weight 20%) ──
  let interviewReadinessScore = 35;
  const completedMockCount = input.completedMocks.length;
  if (completedMockCount > 0) {
    const mockScores = input.completedMocks
      .map((m) => {
        const s = parseJSONObject(m.scores);
        return s?.overallScore || 0;
      })
      .filter((s) => s > 0);
    const avgMockScore = average(mockScores);
    interviewReadinessScore = 30 + (avgMockScore / 100) * 40 + Math.min(completedMockCount * 5, 30);
  }
  interviewReadinessScore = clamp(interviewReadinessScore);

  // ── Behavioral Confidence (0-100, weight 15%) ──
  let behavioralConfidenceScore = 40;
  const behavioralAnswers = input.mockAnswers.filter((a) => {
    const s = parseJSONObject(a.scores);
    return s?.clarity || s?.confidence;
  });
  if (behavioralAnswers.length > 0) {
    const clarityScores = behavioralAnswers.map((a) => parseJSONObject(a.scores)?.clarity || 5);
    const confidenceScores = behavioralAnswers.map((a) => parseJSONObject(a.scores)?.confidence || 5);
    behavioralConfidenceScore = Math.round(
      (average(clarityScores) + average(confidenceScores)) / 2 * 10
    );
  }
  behavioralConfidenceScore = clamp(behavioralConfidenceScore);

  // ── Technical Readiness (0-100, weight 15%) ──
  let technicalReadinessScore = 40;
  const technicalAnswers = input.mockAnswers.filter((a) => {
    const s = parseJSONObject(a.scores);
    return s?.relevance || s?.structure;
  });
  if (technicalAnswers.length > 0) {
    const relevanceScores = technicalAnswers.map((a) => parseJSONObject(a.scores)?.relevance || 5);
    const structureScores = technicalAnswers.map((a) => parseJSONObject(a.scores)?.structure || 5);
    technicalReadinessScore = Math.round(
      (average(relevanceScores) + average(structureScores)) / 2 * 10
    );
  }
  technicalReadinessScore = clamp(technicalReadinessScore);

  // ── Market Competitiveness (0-100, weight 15%) ──
  let marketCompetitivenessScore = 35;
  marketCompetitivenessScore += Math.min(input.skillCount * 4, 20);
  marketCompetitivenessScore += input.hasResume ? 15 : 0;
  marketCompetitivenessScore += completedMockCount > 0 ? 15 : 0;
  if (input.latestAnalysis) {
    marketCompetitivenessScore += (input.latestAnalysis.matchScore / 100) * 15;
  }
  marketCompetitivenessScore = clamp(marketCompetitivenessScore);

  // ── Weighted Overall Score ──
  const overallScore = Math.round(
    resumeQualityScore * 0.20 +
    atsScore * 0.15 +
    interviewReadinessScore * 0.20 +
    behavioralConfidenceScore * 0.15 +
    technicalReadinessScore * 0.15 +
    marketCompetitivenessScore * 0.15
  );

  // ── Strengths & Weaknesses ──
  const dimensions: { name: string; score: number }[] = [
    { name: "Resume Quality", score: resumeQualityScore },
    { name: "ATS Optimization", score: atsScore },
    { name: "Interview Readiness", score: interviewReadinessScore },
    { name: "Behavioral Confidence", score: behavioralConfidenceScore },
    { name: "Technical Readiness", score: technicalReadinessScore },
    { name: "Market Competitiveness", score: marketCompetitivenessScore },
  ];

  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 2).map((d) => d.name);
  const weaknesses = sorted.slice(-2).reverse().map((d) => d.name);

  return {
    overallScore,
    resumeQualityScore,
    atsScore,
    interviewReadinessScore,
    behavioralConfidenceScore,
    technicalReadinessScore,
    marketCompetitivenessScore,
    level: getLevel(overallScore),
    strengths,
    weaknesses,
  };
}

function parseJSONObject(val: string | null | undefined): any {
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

export async function computeAndStoreReadiness(userId: string): Promise<ReadinessResult> {
  console.log("[READINESS] recalculate_start", { userId });

  // Gather data
  const latestAnalysis = await prisma.analysis.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const completedMocks = await prisma.mockInterview.findMany({
    where: { userId, status: "completed" },
    select: { id: true, scores: true },
  });

  const completedMockIds = completedMocks.map((m) => m.id);
  const mockAnswers = completedMockIds.length > 0
    ? await prisma.mockAnswer.findMany({
        where: { mockInterviewId: { in: completedMockIds } },
        select: { scores: true },
      })
    : [];

  // Get skills from latest job extraction
  const latestJobSession = await prisma.jobRecommendationSession.findFirst({
    where: { userId },
    orderBy: { generatedAt: "desc" },
    select: { extractedData: true },
  });
  let skillCount = 0;
  if (latestJobSession?.extractedData) {
    try {
      const d = JSON.parse(latestJobSession.extractedData);
      skillCount = d.skills?.length || 0;
    } catch {}
  }

  const hasResume = !!(await prisma.resume.findFirst({
    where: { userId },
    select: { id: true },
  }));

  const result = calculateReadiness({
    userId,
    latestAnalysis: latestAnalysis ? {
      matchScore: latestAnalysis.matchScore,
      strengths: latestAnalysis.strengths,
      missingKeywords: latestAnalysis.missingKeywords,
      weakAreas: latestAnalysis.weakAreas,
      resumeImprovements: latestAnalysis.resumeImprovements,
    } : null,
    completedMocks,
    mockAnswers,
    questions: [],
    skillCount,
    hasResume,
  });

  // Upsert to DB
  await prisma.userReadiness.upsert({
    where: { userId },
    update: {
      overallScore: result.overallScore,
      resumeQualityScore: result.resumeQualityScore,
      atsScore: result.atsScore,
      interviewReadinessScore: result.interviewReadinessScore,
      behavioralConfidenceScore: result.behavioralConfidenceScore,
      technicalReadinessScore: result.technicalReadinessScore,
      marketCompetitivenessScore: result.marketCompetitivenessScore,
      level: result.level,
      strengths: JSON.stringify(result.strengths),
      weaknesses: JSON.stringify(result.weaknesses),
      lastCalculatedAt: new Date(),
    },
    create: {
      userId,
      overallScore: result.overallScore,
      resumeQualityScore: result.resumeQualityScore,
      atsScore: result.atsScore,
      interviewReadinessScore: result.interviewReadinessScore,
      behavioralConfidenceScore: result.behavioralConfidenceScore,
      technicalReadinessScore: result.technicalReadinessScore,
      marketCompetitivenessScore: result.marketCompetitivenessScore,
      level: result.level,
      strengths: JSON.stringify(result.strengths),
      weaknesses: JSON.stringify(result.weaknesses),
    },
  });

  console.log("[READINESS] recalculated", {
    userId,
    overallScore: result.overallScore,
    level: result.level,
  });

  return result;
}

export async function getReadiness(userId: string) {
  return prisma.userReadiness.findUnique({
    where: { userId },
  });
}
