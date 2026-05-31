import { prisma } from "@/lib/prisma";
import { getReadiness } from "@/lib/readiness";
import { getPerformanceData } from "@/lib/performance";
import { extractProfile } from "@/lib/jobs/extraction";

interface TaskTemplate {
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedMinutes: number;
  improvementImpact: string;
}

// ── Task template library ──
const RESUME_TASKS: TaskTemplate[] = [
  { title: "Add quantified achievements", description: "Go through your resume and add 3-5 metrics-driven bullet points (numbers, percentages, scale).", category: "resume", priority: "high", estimatedMinutes: 20, improvementImpact: JSON.stringify({ dimension: "resumeQualityScore", points: 4 }) },
  { title: "Optimize ATS keywords", description: "Compare your resume against 3 target job descriptions and add missing keywords where they naturally fit.", category: "ats", priority: "high", estimatedMinutes: 25, improvementImpact: JSON.stringify({ dimension: "atsScore", points: 5 }) },
  { title: "Rewrite your summary section", description: "Replace generic summary text with a 2-3 sentence pitch that names your top skills and target role.", category: "resume", priority: "medium", estimatedMinutes: 15, improvementImpact: JSON.stringify({ dimension: "resumeQualityScore", points: 3 }) },
  { title: "Format resume for ATS compatibility", description: "Remove tables, columns, images, and non-standard formatting. Save as plain text to verify parsability.", category: "ats", priority: "medium", estimatedMinutes: 20, improvementImpact: JSON.stringify({ dimension: "atsScore", points: 4 }) },
  { title: "Tailor projects section", description: "Rewrite 2 project descriptions to highlight technical decisions, your specific contribution, and measurable outcomes.", category: "resume", priority: "medium", estimatedMinutes: 20, improvementImpact: JSON.stringify({ dimension: "resumeQualityScore", points: 3 }) },
  { title: "Add a skills matrix", description: "Create a categorized skills section (Languages, Frameworks, Tools, Cloud) with proficiency levels.", category: "ats", priority: "low", estimatedMinutes: 15, improvementImpact: JSON.stringify({ dimension: "atsScore", points: 2 }) },
];

const INTERVIEW_TASKS: TaskTemplate[] = [
  { title: "Complete a mock interview", description: "Run through a full 5-question mock interview on PrepFit. Focus on answering naturally, not perfectly.", category: "mock", priority: "high", estimatedMinutes: 25, improvementImpact: JSON.stringify({ dimension: "interviewReadinessScore", points: 5 }) },
  { title: "Practice STAR framework", description: "Write out 3 full STAR responses (Situation, Task, Action, Result) for common behavioral questions.", category: "behavioral", priority: "high", estimatedMinutes: 20, improvementImpact: JSON.stringify({ dimension: "behavioralConfidenceScore", points: 4 }) },
  { title: "Record and review yourself", description: "Record yourself answering 3 interview questions. Watch back and note filler words, pace, and clarity.", category: "behavioral", priority: "medium", estimatedMinutes: 15, improvementImpact: JSON.stringify({ dimension: "behavioralConfidenceScore", points: 3 }) },
  { title: "Speed-answer drill", description: "Set a 60-second timer for each of 5 common questions. Practice concise, complete answers.", category: "behavioral", priority: "medium", estimatedMinutes: 10, improvementImpact: JSON.stringify({ dimension: "behavioralConfidenceScore", points: 2 }) },
  { title: "Technical concept review", description: "Pick 3 core technical concepts for your target role. Write a 2-minute verbal explanation for each.", category: "technical", priority: "medium", estimatedMinutes: 25, improvementImpact: JSON.stringify({ dimension: "technicalReadinessScore", points: 4 }) },
  { title: "System design basics", description: "Sketch a high-level architecture for a common system (URL shortener, chat app, etc.). Focus on trade-offs.", category: "technical", priority: "medium", estimatedMinutes: 30, improvementImpact: JSON.stringify({ dimension: "technicalReadinessScore", points: 3 }) },
  { title: "Confidence-building exercise", description: "Write down 5 specific accomplishments you're proud of. Practice stating each one confidently out loud.", category: "behavioral", priority: "low", estimatedMinutes: 10, improvementImpact: JSON.stringify({ dimension: "behavioralConfidenceScore", points: 2 }) },
];

const JOBHUNT_TASKS: TaskTemplate[] = [
  { title: "Update job search profile", description: "Refresh your Job Hunt with AI profile. Make sure it reflects your latest resume and target role.", category: "jobhunt", priority: "medium", estimatedMinutes: 15, improvementImpact: JSON.stringify({ dimension: "marketCompetitivenessScore", points: 3 }) },
  { title: "Research 5 target companies", description: "Identify 5 companies hiring for your role. Note their tech stack, culture, and 2 recent news items.", category: "jobhunt", priority: "medium", estimatedMinutes: 25, improvementImpact: JSON.stringify({ dimension: "marketCompetitivenessScore", points: 3 }) },
  { title: "Tailor resume for a specific job", description: "Pick one job posting and create a tailored version of your resume that matches its requirements.", category: "jobhunt", priority: "high", estimatedMinutes: 30, improvementImpact: JSON.stringify({ dimension: "marketCompetitivenessScore", points: 5 }) },
  { title: "Practice elevator pitch", description: "Write and rehearse a 30-second pitch that covers who you are, what you do, and what role you want.", category: "behavioral", priority: "medium", estimatedMinutes: 15, improvementImpact: JSON.stringify({ dimension: "behavioralConfidenceScore", points: 2 }) },
];

// ── Generation engine ──
export async function generateRoadmap(userId: string): Promise<string> {
  console.log("[ROADMAP] generation_start", { userId });

  // Gather all context
  const readiness = await getReadiness(userId);
  const perf = await getPerformanceData(userId);

  // Get resume data
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { selectedResumeId: true },
  });
  const resume = dbUser?.selectedResumeId
    ? await prisma.resume.findUnique({ where: { id: dbUser.selectedResumeId } })
    : null;

  let profile: any = null;
  if (resume) {
    try { profile = await extractProfile(resume.content); } catch {}
  }

  const currentScore = readiness?.overallScore || 45;
  const strengthsRaw = readiness?.strengths ? (() => { try { return JSON.parse(readiness.strengths); } catch { return []; } })() : [];
  const role = profile?.target_roles?.[0] || strengthsRaw[0] || "your target role";
  const expLevel = profile?.experience_level || "entry";
  const weaknesses: string[] = readiness?.weaknesses
    ? (() => { try { return JSON.parse(readiness?.weaknesses ?? "[]"); } catch { return []; } })()
    : [];
  const strengths: string[] = readiness?.strengths
    ? (() => { try { return JSON.parse(readiness?.strengths ?? "[]"); } catch { return []; } })()
    : [];

  const perfWeak = perf.weakestAreas || [];

  // Build task pool weighted by user's actual gaps
  const taskPool: TaskTemplate[] = [];

  // Always include core resume tasks
  taskPool.push(...RESUME_TASKS);

  // Interview tasks based on performance data
  const hasInterviewGaps = weaknesses.some((w) =>
    w.toLowerCase().includes("interview") || w.toLowerCase().includes("behavioral") ||
    w.toLowerCase().includes("confidence") || w.toLowerCase().includes("technical")
  );
  if (hasInterviewGaps || perfWeak.length > 0 || currentScore < 50) {
    taskPool.push(...INTERVIEW_TASKS);
  }

  // Add job hunt tasks if market competitiveness is low
  if (readiness?.marketCompetitivenessScore && readiness.marketCompetitivenessScore < 60) {
    taskPool.push(...JOBHUNT_TASKS);
  }

  // Ensure minimum task variety
  if (taskPool.length < 14) {
    taskPool.push(...INTERVIEW_TASKS.slice(0, 4));
  }

  // Shuffle then assign to days (deterministic based on user profile)
  const shuffled = shuffleWithSeed(taskPool, userId);
  const totalDays = 30;
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + totalDays * 86400000);

  const tasks: any[] = [];
  const usedTasks = new Set<string>();
  let taskIdx = 0;

  for (let day = 0; day < totalDays; day++) {
    const tasksToday = day === 0 || day === totalDays - 1 ? 2 : (day % 3 === 0 ? 3 : 2);
    for (let t = 0; t < tasksToday && taskIdx < shuffled.length; t++) {
      const template = shuffled[taskIdx % shuffled.length];
      const dedupKey = `${day}-${template.title}`;
      if (!usedTasks.has(dedupKey)) {
        usedTasks.add(dedupKey);
        tasks.push({
          dayNumber: day + 1,
          weekNumber: Math.ceil((day + 1) / 7),
          title: template.title,
          description: template.description,
          category: template.category,
          priority: template.priority,
          estimatedMinutes: template.estimatedMinutes,
          improvementImpact: template.improvementImpact,
          premium: day >= 7, // first 7 days free, rest premium
        });
      }
      taskIdx++;
    }
  }

  // Generate reasoning
  const reasoning = {
    currentScore,
    strengths: strengths.slice(0, 2),
    weaknesses: weaknesses.slice(0, 3),
    performanceGaps: perfWeak.slice(0, 2),
    focusAreas: weaknesses.slice(0, 2).concat(perfWeak.slice(0, 1)),
  };

  // Diagnostic: verify Prisma models are accessible
  console.error("[ROADMAP DB ERROR]", {
    hasCareerRoadmap: !!prisma.careerRoadmap,
    hasRoadmapTask: !!prisma.roadmapTask,
    hasUserReadiness: !!prisma.userReadiness,
  });

  let roadmap: any = null;

  try {
    // Step 1: Archive existing active roadmap
    console.log("[ROADMAP] step_1_archive");
    await prisma.careerRoadmap.updateMany({
      where: { userId, status: "active" },
      data: { status: "archived" },
    });

    // Step 2: Create roadmap (single statement, no nested writes)
    console.log("[ROADMAP] step_2_create_roadmap");
    roadmap = await prisma.careerRoadmap.create({
      data: {
        userId,
        title: `30-Day Hiring Plan — ${role}`,
        goalRole: role,
        experienceLevel: expLevel,
        currentReadiness: currentScore,
        targetReadiness: Math.min(currentScore + 30, 95),
        status: "active",
        generatedReasoning: JSON.stringify(reasoning),
        startDate,
        endDate,
      },
    });

    // Step 3: Insert tasks one at a time (Neon HTTP: no createMany, no batches)
    console.log("[ROADMAP] step_3_create_tasks", { count: tasks.length });
    for (let i = 0; i < tasks.length; i++) {
      console.log("[ROADMAP] creating_task", { index: i + 1, total: tasks.length });
      await prisma.roadmapTask.create({
        data: {
          roadmapId: roadmap.id,
          dayNumber: tasks[i].dayNumber,
          weekNumber: tasks[i].weekNumber,
          title: tasks[i].title,
          description: tasks[i].description,
          category: tasks[i].category,
          priority: tasks[i].priority,
          estimatedMinutes: tasks[i].estimatedMinutes,
          improvementImpact: tasks[i].improvementImpact,
          premium: tasks[i].premium,
        },
      });
    }

    console.log("[ROADMAP] generated", {
      roadmapId: roadmap.id,
      taskCount: tasks.length,
      currentScore,
      role,
    });

    return roadmap.id;
  } catch (err: any) {
    // Rollback: if roadmap was created but task inserts failed, delete orphan
    if (roadmap?.id) {
      console.error("[ROADMAP] rolling_back_orphan", { roadmapId: roadmap.id });
      await prisma.careerRoadmap.delete({ where: { id: roadmap.id } }).catch(() => {});
    }
    console.error("[ROADMAP DB ERROR]", {
      hasCareerRoadmap: !!prisma.careerRoadmap,
      hasRoadmapTask: !!prisma.roadmapTask,
      error: err?.message,
      code: err?.code,
    });
    throw err;
  }
}

// ── Get active roadmap ──
export async function getActiveRoadmap(userId: string) {
  return prisma.careerRoadmap.findFirst({
    where: { userId, status: "active" },
    include: { tasks: { orderBy: { dayNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

// ── Toggle task completion ──
export async function toggleTask(taskId: string, userId: string) {
  const task = await prisma.roadmapTask.findUnique({
    where: { id: taskId },
    include: { roadmap: true },
  });
  if (!task || task.roadmap.userId !== userId) return null;

  return prisma.roadmapTask.update({
    where: { id: taskId },
    data: {
      completed: !task.completed,
      completionDate: !task.completed ? new Date() : null,
    },
  });
}

// ── Progress stats ──
export async function getProgress(roadmapId: string) {
  const tasks = await prisma.roadmapTask.findMany({ where: { roadmapId } });
  const completed = tasks.filter((t) => t.completed).length;
  const today = tasks.filter((t) => t.dayNumber === getCurrentDay());
  return {
    total: tasks.length,
    completed,
    progress: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
    currentDay: getCurrentDay(),
    today,
    streak: calculateStreak(tasks),
  };
}

function getCurrentDay(): number {
  // Day 1 = start, count up
  return 1; // For MVP, always show day 1 tasks; user advances naturally
}

function calculateStreak(tasks: any[]): number {
  let streak = 0;
  const sorted = [...tasks].sort((a, b) => b.dayNumber - a.dayNumber);
  for (const t of sorted) {
    if (t.completed) streak++;
    else break;
  }
  return streak;
}

function shuffleWithSeed<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) | 0;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
