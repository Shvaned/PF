import { prisma } from "@/lib/prisma";

/** Record a performance snapshot after an analysis */
export async function recordSnapshot(
  resumeId: string,
  userId: string,
  data: { matchScore: number; analysisId: string; jobRole?: string | null }
) {
  const snap = await prisma.resumePerformanceSnapshot.create({
    data: {
      resumeId,
      userId,
      matchScore: data.matchScore,
      atsScore: Math.round(data.matchScore * 0.7 + 20), // heuristic from matchScore
      resumeQuality: Math.round(data.matchScore * 0.6 + 25),
      technicalStrength: 0,
      behavioralStrength: 0,
      jobRole: data.jobRole || null,
      analysisId: data.analysisId,
    },
  });

  // Update resume aggregate stats
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (resume) {
    const allSnaps = await prisma.resumePerformanceSnapshot.findMany({
      where: { resumeId },
      select: { matchScore: true },
    });
    const avg = allSnaps.length > 0
      ? allSnaps.reduce((s, n) => s + n.matchScore, 0) / allSnaps.length
      : data.matchScore;
    const best = allSnaps.length > 0
      ? Math.max(...allSnaps.map((n) => n.matchScore))
      : data.matchScore;

    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        timesUsed: { increment: 1 },
        totalAnalyses: { increment: 1 },
        averageMatchScore: Math.round(avg),
        bestMatchScore: best,
        lastUsedAt: new Date(),
        performanceMetadata: JSON.stringify({
          snapshotCount: allSnaps.length + 1,
          lastUpdated: new Date().toISOString(),
        }),
      },
    });
  }

  return snap;
}

/** Duplicate a resume as a new variant */
export async function duplicateResume(resumeId: string, userId: string, newLabel?: string) {
  const source = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!source || source.userId !== userId) return null;

  return prisma.resume.create({
    data: {
      userId,
      title: source.title ? `${source.title} (Copy)` : "Untitled Resume",
      content: source.content,
      uploadType: source.uploadType,
      fileName: source.fileName,
      resumeLabel: newLabel || `${source.resumeLabel || source.title} Variant`,
      resumeType: source.resumeType || "custom",
    },
  });
}

/** Compare two resumes side by side */
export async function compareResumes(resumeIdA: string, resumeIdB: string, userId: string) {
  const [a, b] = await Promise.all([
    prisma.resume.findUnique({ where: { id: resumeIdA } }),
    prisma.resume.findUnique({ where: { id: resumeIdB } }),
  ]);
  if (!a || a.userId !== userId || !b || b.userId !== userId) return null;

  const [snapsA, snapsB] = await Promise.all([
    prisma.resumePerformanceSnapshot.findMany({ where: { resumeId: resumeIdA }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.resumePerformanceSnapshot.findMany({ where: { resumeId: resumeIdB }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return {
    a: { id: a.id, title: a.title, label: a.resumeLabel, type: a.resumeType, avgMatch: a.averageMatchScore, bestMatch: a.bestMatchScore, totalAnalyses: a.totalAnalyses, timesUsed: a.timesUsed, recentScores: snapsA.map((s) => s.matchScore) },
    b: { id: b.id, title: b.title, label: b.resumeLabel, type: b.resumeType, avgMatch: b.averageMatchScore, bestMatch: b.bestMatchScore, totalAnalyses: b.totalAnalyses, timesUsed: b.timesUsed, recentScores: snapsB.map((s) => s.matchScore) },
  };
}

/** Recommend best resume for a given job role */
export async function recommendResume(userId: string, jobRole?: string | null) {
  const resumes = await prisma.resume.findMany({
    where: { userId, isArchived: false },
    orderBy: { averageMatchScore: "desc" },
  });

  if (resumes.length === 0) return null;
  if (resumes.length === 1) return resumes[0];

  // If jobRole provided, prefer resumes whose label/type matches
  if (jobRole) {
    const roleLower = jobRole.toLowerCase();
    const scored = resumes.map((r) => {
      let score = r.averageMatchScore;
      if (r.resumeLabel?.toLowerCase().includes(roleLower)) score += 15;
      if (r.resumeType?.toLowerCase().includes(roleLower)) score += 10;
      return { resume: r, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].resume;
  }

  return resumes[0]; // highest average match score
}

/** Get performance data for all user resumes */
export async function getResumeLabData(userId: string) {
  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      performanceSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  const selectedId = (await prisma.user.findUnique({
    where: { id: userId },
    select: { selectedResumeId: true },
  }))?.selectedResumeId;

  return { resumes, selectedId };
}

/** Update resume label and type */
export async function updateResumeMeta(
  resumeId: string,
  userId: string,
  data: { resumeLabel?: string; resumeType?: string; isArchived?: boolean }
) {
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.userId !== userId) return null;

  return prisma.resume.update({
    where: { id: resumeId },
    data: {
      ...(data.resumeLabel !== undefined && { resumeLabel: data.resumeLabel }),
      ...(data.resumeType !== undefined && { resumeType: data.resumeType }),
      ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
    },
  });
}
