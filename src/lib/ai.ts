import { generateCompletion } from "@/lib/llm/router";
import { buildCacheKey, cacheGet, cacheSet } from "@/lib/llm/cache";
import { extractJSON, extractJSONArray } from "@/lib/llm/validation";

interface AnalysisInput {
  resumeText: string;
  jobDescription: string;
  roleCategory?: string;
}

interface AnalysisResult {
  matchScore: number;
  strengths: string[];
  missingKeywords: string[];
  weakAreas: string[];
  resumeImprovements: string[];
  summary: string;
  questions: Question[];
  answerGuidance: AnswerGuidance[];
  jobCategory: string;
}

interface Question {
  id: string;
  type: "technical" | "behavioral" | "hr" | "mixed";
  question: string;
  relevance: "high" | "medium" | "low";
}

interface AnswerGuidance {
  questionId: string;
  keyPoints: string[];
  dontForget: string[];
}

interface MockInterviewConfig {
  resumeText: string;
  jobDescription: string;
  difficulty: "beginner" | "standard" | "hard";
  questionTypes: string;
  questionCount: number;
  companyName?: string | null;
}

interface EvaluateAnswerInput {
  question: string;
  userAnswer: string;
  jobDescription: string;
  resumeText: string;
}

/* ── Resume + JD Analysis (Nemotron → GLM → GPT-OSS) — 4000 tokens ── */

export async function analyzeResumeAndJob(input: AnalysisInput): Promise<AnalysisResult> {
  const cacheKey = buildCacheKey(input);
  const cached = cacheGet(cacheKey);
  if (cached) {
    console.log("[AI] cache_hit analysis");
    return JSON.parse(cached);
  }

  const roleHint = input.roleCategory && input.roleCategory !== "general"
    ? `\nThe candidate is targeting a ${input.roleCategory} role. Tailor your analysis, questions, and keywords to this field.\n`
    : "";

  const prompt = `Analyze this resume against the job description. Return ONLY valid JSON (no markdown):

Resume:
${input.resumeText}

Job Description:
${input.jobDescription}${roleHint}

JSON structure:
{"matchScore":<0-100>,"strengths":["..."],"missingKeywords":["..."],"weakAreas":["..."],"resumeImprovements":["..."],"summary":"<2-3 sentences>","jobCategory":"<category>","questions":[{"id":"q1","type":"technical|behavioral|hr|mixed","question":"...","relevance":"high|medium|low"}],"answerGuidance":[{"questionId":"q1","keyPoints":["..."],"dontForget":["..."]}]}

Be concise. 8-12 questions. 3-6 items per list. No filler.`;

  const response = await generateCompletion({
    task: "resume-analysis",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 4000,
    validate: (c) => extractJSON(c) !== null,
  });

  const content = response.choices[0]?.message?.content?.trim() || "";
  const result = extractJSON(content) as AnalysisResult;
  if (!result) throw new Error("Failed to parse AI response");

  cacheSet(cacheKey, JSON.stringify(result));
  return result;
}

/* ── Mock Interview Questions (Laguna → Nemotron) — 2000 tokens ── */

export async function generateMockQuestions(config: MockInterviewConfig): Promise<Question[]> {
  let companyContext = "";
  if (config.companyName) {
    const { buildCompanyPrompt } = await import("@/lib/company-profiles");
    const { promptExtension } = buildCompanyPrompt(config.companyName);
    companyContext = promptExtension;
  }

  const prompt = `Create ${config.questionCount} ${config.difficulty} ${config.questionTypes} interview questions. Return ONLY a JSON array (no markdown):

Resume: ${config.resumeText.slice(0, 1500)}
Job Description: ${config.jobDescription.slice(0, 1500)}${companyContext ? "\n" + companyContext : ""}

Format: [{"id":"mq1","type":"technical|behavioral|hr|mixed","question":"...","relevance":"high|medium|low"}]

Order warm-up to deep. Be specific to resume/JD${config.companyName ? " and match " + config.companyName + " interview style" : ""}.`;

  const response = await generateCompletion({
    task: "mock-questions",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
    validate: (c) => extractJSONArray(c) !== null,
  });

  const content = response.choices[0]?.message?.content?.trim() || "";
  const result = extractJSONArray(content) as Question[];
  if (!result) throw new Error("Failed to parse AI response");

  return result;
}

/* ── Answer Evaluation (Nemotron → Laguna) — 800 tokens ── */

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<{
  clarity: number;
  relevance: number;
  confidence: number;
  structure: number;
  feedback: string;
  missingPoints: string[];
}> {
  const prompt = `Evaluate this entry-level candidate's answer. Return ONLY valid JSON (no markdown):

Question: ${input.question}
Answer: ${input.userAnswer.slice(0, 2000)}
Job: ${input.jobDescription.slice(0, 1000)}

JSON: {"clarity":<1-10>,"relevance":<1-10>,"confidence":<1-10>,"structure":<1-10>,"feedback":"<2-3 sentences, constructive>","missingPoints":["..."]}

Be constructive, specific, actionable.`;

  const response = await generateCompletion({
    task: "weak-feedback",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 800,
    validate: (c) => extractJSON(c) !== null,
  });

  const content = response.choices[0]?.message?.content?.trim() || "";
  const result = extractJSON(content);
  if (!result) throw new Error("Failed to parse AI response");

  return result;
}

/* ── Final Report (Nemotron → Laguna) — 2000 tokens ── */

export async function generateFinalReport(results: {
  questions: string[];
  answers: string[];
  scores: Record<string, number>[];
}): Promise<{
  overallScore: number;
  categoryScores: { name: string; score: number }[];
  strongestArea: string;
  weakestArea: string;
  recurringWeakAreas: string[];
  improvementTips: string[];
  nextStep: string;
}> {
  const prompt = `Final interview report for entry-level candidate. Return ONLY valid JSON (no markdown):

Q&A: ${results.questions.map((q, i) => `Q${i + 1}: ${q.slice(0, 100)}\nA${i + 1}: ${(results.answers[i] || "").slice(0, 200)}`).join("\n")}

Scores: ${JSON.stringify(results.scores)}

JSON: {"overallScore":<1-100>,"categoryScores":[{"name":"Communication","score":<1-10>},{"name":"Technical Depth","score":<1-10>},{"name":"Confidence","score":<1-10>},{"name":"Problem Solving","score":<1-10>}],"strongestArea":"...","weakestArea":"...","recurringWeakAreas":["..."],"improvementTips":["..."],"nextStep":"..."}

Be honest, encouraging, specific.`;

  const response = await generateCompletion({
    task: "weak-feedback",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
    validate: (c) => extractJSON(c) !== null,
  });

  const content = response.choices[0]?.message?.content?.trim() || "";
  const result = extractJSON(content);
  if (!result) throw new Error("Failed to parse AI response");

  return result;
}
