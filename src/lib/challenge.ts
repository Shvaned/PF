import { prisma } from "@/lib/prisma";

const QUESTION_BANK: Record<string, string[]> = {
  behavioral: [
    "Describe a time you handled a conflict with a teammate. What did you do?",
    "Tell me about a project that failed. What did you learn?",
    "Give an example of when you took initiative beyond your role.",
    "Describe a situation where you had to meet a tight deadline. How did you handle it?",
    "Tell me about a time you received critical feedback. How did you respond?",
    "Describe a decision you made that was unpopular. How did you communicate it?",
    "Tell me about a time you had to learn something completely new on the job.",
    "Describe a situation where you disagreed with your manager. What happened?",
    "Tell me about your biggest professional achievement so far.",
    "How do you prioritize when everything feels urgent?",
  ],
  technical: [
    "Explain the difference between REST and GraphQL. When would you use each?",
    "How would you design a URL shortener service? Walk me through your approach.",
    "What is database indexing and when would you use it?",
    "Explain how you would debug a slow API endpoint in production.",
    "What's the difference between SQL and NoSQL databases? Give examples.",
    "How would you handle authentication in a distributed system?",
    "Explain the concept of containerization and why it matters.",
    "How would you optimize a query that's scanning millions of rows?",
    "Describe your approach to writing unit tests. What do you test and why?",
    "What is eventual consistency and when is it acceptable?",
  ],
  resume: [
    "Walk me through your resume in under 60 seconds.",
    "What's the most impactful project on your resume? Describe your specific contribution.",
    "Why should we hire you over someone with more experience?",
    "How does your background prepare you for this specific role?",
    "Tell me about a technical skill on your resume you're most proud of.",
  ],
  confidence: [
    "Introduce yourself as if you're meeting a hiring manager for the first time. 60 seconds.",
    "What are your three biggest strengths? Give a specific example for each.",
    "Why do you want to work in this industry? Be specific and genuine.",
    "Tell me about something you're passionate about outside of work. Connect it to your professional strengths.",
    "If you could redo one career decision, what would it be and why?",
  ],
  system_design: [
    "Design a notification system that handles 1 million users. What are the key components?",
    "How would you build a real-time chat application? Focus on the architecture.",
    "Design a rate limiter for an API. What algorithm would you use?",
    "How would you design a job queue that can handle failures gracefully?",
    "Explain how you would scale a monolithic application to microservices.",
  ],
};

const TYPE_CYCLE: string[] = ["behavioral", "technical", "confidence", "behavioral", "resume"];

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getOrGenerateChallenge(userId: string) {
  const today = getToday();

  // Check if today's challenge already exists
  const existing = await prisma.dailyChallenge.findUnique({
    where: { userId_generatedDate: { userId, generatedDate: today } },
  });
  if (existing) return existing;

  // Gather personalization context
  const readiness = await prisma.userReadiness.findUnique({ where: { userId } });
  const recentChallenges = await prisma.dailyChallenge.findMany({
    where: { userId },
    orderBy: { generatedDate: "desc" },
    take: 5,
  });
  const performanceSnapshot = await prisma.weakAreaSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Determine which type to generate — prioritize weak areas, use rotation
  const recentTypes = recentChallenges.map((c) => c.questionType);
  let questionType = "behavioral";

  if (performanceSnapshot) {
    const dims: { key: string; score: number }[] = [
      { key: "behavioral", score: performanceSnapshot.behavioralScore },
      { key: "technical", score: performanceSnapshot.technicalScore },
      { key: "confidence", score: performanceSnapshot.confidenceScore },
    ];
    dims.sort((a, b) => a.score - b.score);
    // Pick the weakest dimension that hasn't been used recently
    for (const d of dims) {
      const mappedType = d.key === "behavioral" ? "behavioral" :
        d.key === "technical" ? "technical" : "confidence";
      if (!recentTypes.slice(0, 2).includes(mappedType)) {
        questionType = mappedType;
        break;
      }
    }
  }

  // Fall back to rotation if no clear weak area
  if (recentTypes.includes(questionType) || !performanceSnapshot) {
    for (const t of TYPE_CYCLE) {
      if (!recentTypes.slice(0, 2).includes(t)) {
        questionType = t;
        break;
      }
    }
  }

  // Get difficulty from readiness level
  const score = readiness?.overallScore || 45;
  const difficulty = score >= 75 ? "hard" : score >= 55 ? "medium" : "easy";

  // Get question from bank — avoid repeating recent questions
  const pool = QUESTION_BANK[questionType] || QUESTION_BANK.behavioral;
  const recentQuestions = recentChallenges.map((c) => c.question);
  const available = pool.filter((q) => !recentQuestions.includes(q));
  const question = available.length > 0 ? available[Math.floor(Math.abs(hash(userId + today)) % available.length)] : pool[0];

  // Determine personalization reason
  const reason = performanceSnapshot
    ? `Your ${questionType} score is ${performanceSnapshot[`${questionType}Score` as keyof typeof performanceSnapshot] || "developing"} — daily practice will improve this.`
    : "Daily practice builds interview confidence and readiness.";

  const challenge = await prisma.dailyChallenge.create({
    data: {
      userId,
      question,
      questionType,
      difficulty,
      personalizationReason: reason,
      generatedDate: today,
    },
  });

  return challenge;
}

export async function submitAnswer(challengeId: string, userId: string, answerText: string) {
  const challenge = await prisma.dailyChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.userId !== userId) return null;
  if (challenge.completed) return challenge;

  // AI evaluation — lightweight version of mock interview evaluation
  const { evaluateAnswer } = await import("@/lib/ai");
  let evaluation: any = null;
  try {
    evaluation = await evaluateAnswer({
      question: challenge.question,
      userAnswer: answerText,
      resumeText: "",
      jobDescription: "",
    });
  } catch {
    // If AI fails, provide basic feedback
    evaluation = {
      clarity: 6,
      relevance: 6,
      confidence: 6,
      structure: 6,
      feedback: "Nice work! Keep practicing daily to improve your interview skills.",
      missingPoints: [],
    };
  }

  const feedback = {
    strengths: buildStrengths(evaluation),
    improvements: buildImprovements(evaluation),
    scores: {
      confidence: (evaluation.confidence || 5) * 10,
      clarity: (evaluation.clarity || 5) * 10,
      relevance: (evaluation.relevance || 5) * 10,
    },
  };

  const overallScore = Math.round(
    ((evaluation.clarity || 5) + (evaluation.confidence || 5) + (evaluation.relevance || 5) + (evaluation.structure || 5)) / 4 * 10
  );

  const updated = await prisma.dailyChallenge.update({
    where: { id: challengeId },
    data: {
      completed: true,
      completedAt: new Date(),
      answerText,
      score: overallScore,
      feedback: JSON.stringify(feedback),
    },
  });

  // Trigger readiness recalculation
  import("@/lib/readiness").then(({ computeAndStoreReadiness }) =>
    computeAndStoreReadiness(userId).catch(() => {})
  );

  return updated;
}

export async function skipChallenge(challengeId: string, userId: string) {
  const challenge = await prisma.dailyChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.userId !== userId) return null;
  // Skipping is allowed — no punishment. Just leave as uncompleted.
  return challenge;
}

export async function getStreak(userId: string): Promise<number> {
  const challenges = await prisma.dailyChallenge.findMany({
    where: { userId },
    orderBy: { generatedDate: "desc" },
    take: 30,
  });

  let streak = 0;
  const today = getToday();
  for (const c of challenges) {
    if (c.completed) streak++;
    else if (c.generatedDate !== today) break; // today's can be uncompleted
  }
  return streak;
}

// ── Helpers ──
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function buildStrengths(evaluation: any): string[] {
  const strengths: string[] = [];
  if (evaluation.clarity >= 7) strengths.push("Excellent clarity in your explanation");
  else if (evaluation.clarity >= 5) strengths.push("Good structure and flow");
  if (evaluation.relevance >= 7) strengths.push("Strong relevance — you stayed on topic");
  else if (evaluation.relevance >= 5) strengths.push("You addressed the core of the question");
  if (evaluation.confidence >= 7) strengths.push("Confident delivery comes through");
  if (evaluation.structure >= 7) strengths.push("Well-organized answer with clear progression");
  if (strengths.length === 0) strengths.push("You completed the challenge — consistency is key");
  return strengths.slice(0, 2);
}

function buildImprovements(evaluation: any): string[] {
  const improvements: string[] = [];
  if (evaluation.clarity < 6) improvements.push("Try being more concise — aim for under 90 seconds");
  if (evaluation.relevance < 6) improvements.push("Stay focused on the specific question asked");
  if (evaluation.confidence < 6) improvements.push("Practice speaking with more conviction and energy");
  if (evaluation.structure < 6) improvements.push("Use STAR method: Situation, Task, Action, Result");
  if (evaluation.missingPoints?.length > 0) improvements.push(`Consider mentioning: ${evaluation.missingPoints.slice(0, 2).join(", ")}`);
  if (improvements.length === 0) improvements.push("Keep up the great work — try a harder question next time");
  return improvements.slice(0, 2);
}
