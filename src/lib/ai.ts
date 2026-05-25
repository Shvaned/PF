import OpenAI from "openai";

let _openai: OpenAI | null = null;
export function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY });
  return _openai;
}

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
}

interface EvaluateAnswerInput {
  question: string;
  userAnswer: string;
  jobDescription: string;
  resumeText: string;
}

export async function analyzeResumeAndJob(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const roleHint = input.roleCategory && input.roleCategory !== "general"
    ? `\nThe candidate is targeting a ${input.roleCategory} role. Tailor your analysis, questions, and keywords to this field.\n`
    : "";

  const prompt = `You are an expert interview coach and resume analyst for entry-level job seekers (0-2 years experience).

Analyze the following resume and job description. Return a structured JSON response.

Resume:
${input.resumeText}

Job Description:
${input.jobDescription}${roleHint}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "matchScore": <number 0-100>,
  "strengths": ["<string>", ...],
  "missingKeywords": ["<string>", ...],
  "weakAreas": ["<string>", ...],
  "resumeImprovements": ["<string>", ...],
  "summary": "<2-3 sentence practical summary>",
  "jobCategory": "<inferred category>",
  "questions": [
    {
      "id": "q1",
      "type": "technical|behavioral|hr|mixed",
      "question": "<tailored question>",
      "relevance": "high|medium|low"
    }
  ],
  "answerGuidance": [
    {
      "questionId": "q1",
      "keyPoints": ["<concise point>"],
      "dontForget": ["<important reminder>"]
    }
  ]
}

Rules:
- Generate 8-12 questions mixed across types, ordered by relevance.
- Each question must directly relate to the resume or job description.
- Keep strengths/weaknesses/keywords to 3-6 items each.
- Keep keyPoints to 2-4 bullets per question.
- Be specific and practical — no generic filler.
- Identify missing skills honestly.`;

  const response = await getOpenAI().chat.completions.create({
    model: "openai/gpt-oss-120b:free",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content?.trim() || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  const result: AnalysisResult = JSON.parse(jsonMatch[0]);
  return result;
}

export async function generateMockQuestions(
  config: MockInterviewConfig
): Promise<Question[]> {
  const prompt = `You are an interview coach creating mock interview questions for an entry-level candidate.

Resume: ${config.resumeText}
Job Description: ${config.jobDescription}
Difficulty: ${config.difficulty}
Question focus: ${config.questionTypes}
Number of questions: ${config.questionCount}

Return ONLY a valid JSON array of question objects (no markdown, no extra text):
[
  {
    "id": "mq1",
    "type": "technical|behavioral|hr|mixed",
    "question": "<the question>",
    "relevance": "high|medium|low"
  }
]

Rules:
- Match the difficulty level (beginner = basic, standard = moderate, hard = challenging).
- Focus on the requested question types.
- Make each question specific to the resume and job description.
- Order from warm-up to deeper questions.`;

  const response = await getOpenAI().chat.completions.create({
    model: "openai/gpt-oss-120b:free",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content?.trim() || "";
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  return JSON.parse(jsonMatch[0]);
}

export async function evaluateAnswer(
  input: EvaluateAnswerInput
): Promise<{
  clarity: number;
  relevance: number;
  confidence: number;
  structure: number;
  feedback: string;
  missingPoints: string[];
}> {
  const prompt = `You are an expert interview coach evaluating an entry-level candidate's mock interview answer.

Question: ${input.question}
Candidate's Answer: ${input.userAnswer}
Job Description: ${input.jobDescription}
Resume (context): ${input.resumeText}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "clarity": <1-10>,
  "relevance": <1-10>,
  "confidence": <1-10>,
  "structure": <1-10>,
  "feedback": "<2-3 sentences of constructive, friendly feedback>",
  "missingPoints": ["<key point the candidate missed>"]
}

Rules:
- Be constructive, not harsh — this is for entry-level candidates.
- Keep feedback practical and actionable.
- Only list genuinely missing points — don't invent weaknesses.`;

  const response = await getOpenAI().chat.completions.create({
    model: "openai/gpt-oss-120b:free",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content?.trim() || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  return JSON.parse(jsonMatch[0]);
}

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
  const prompt = `You are an interview coach providing a final report for an entry-level candidate.

Interview results:
${results.questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${results.answers[i] || "(no answer)"}`).join("\n\n")}

Scores per question:
${JSON.stringify(results.scores, null, 2)}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "overallScore": <1-100>,
  "categoryScores": [
    {"name": "Communication", "score": <1-10>},
    {"name": "Technical Depth", "score": <1-10>},
    {"name": "Confidence", "score": <1-10>},
    {"name": "Problem Solving", "score": <1-10>}
  ],
  "strongestArea": "<single area name>",
  "weakestArea": "<single area name>",
  "recurringWeakAreas": ["<pattern>"],
  "improvementTips": ["<actionable tip>"],
  "nextStep": "<one concrete next practice recommendation>"
}

Rules:
- Be honest but encouraging.
- Make tips specific and actionable.
- Recommend next steps based on the weakest area.`;

  const response = await getOpenAI().chat.completions.create({
    model: "openai/gpt-oss-120b:free",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content?.trim() || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  return JSON.parse(jsonMatch[0]);
}
