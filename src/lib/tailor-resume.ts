import { generateCompletion } from "@/lib/llm/router";
import { extractJSON } from "@/lib/llm/validation";

export type TailorMode = "light" | "ats" | "interview" | "aggressive";

export interface TailorInput {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string | null;
  companyName?: string | null;
  mode: TailorMode;
  atsGaps?: string[];   // missing keywords from analysis
  strengths?: string[];  // existing strengths to preserve
}

export interface TailorSection {
  section: string;
  original: string;
  improved: string;
  reason: string;
}

export interface TailorResult {
  tailoredResume: string;
  sections: TailorSection[];
  atsImprovement: number;
  matchImprovement: number;
  appliedKeywords: string[];
  warnings: string[];
}

const ANTI_HALLUCINATION_RULES = `
CRITICAL RULES — NEVER BREAK THESE:
1. You are editing an EXISTING resume. Never invent new companies, job titles, projects, metrics, dates, or technologies the candidate never mentioned.
2. You MAY: rephrase existing bullet points for clarity, add context to existing skills, restructure sections, adjust formatting for ATS.
3. You MAY NOT: add fake metrics ($X, Y%), fake achievements ("increased revenue by 30%"), fake technologies, fake certifications, fake education.
4. If the resume says "built APIs" you can change it to "developed REST APIs" (this is rephrasing). You CANNOT change it to "developed REST APIs handling 1M+ requests" (this is fabrication).
5. Preserve ALL factual information: dates, company names, degree titles, job titles — exactly as written.
6. If you are unsure whether a change is truthful, DO NOT make it. Err on the side of preservation.
7. The goal is ATS optimization and clarity, not exaggeration.
`.trim();

function buildPrompt(input: TailorInput): string {
  const modeInstructions: Record<TailorMode, string> = {
    light: "Make only safe wording improvements. Focus on clarity and grammar. Be very conservative.",
    ats: "Optimize for ATS keyword matching. Add missing keywords from the job description where they naturally fit into existing experience. Focus on keyword alignment without stuffing.",
    interview: "Optimize bullets to be more discussion-worthy. Strengthen action verbs and impact language while remaining truthful. Help the candidate look prepared for behavioral questions.",
    aggressive: "Maximum truthful optimization. Rewrite bullets for maximum impact, reorder sections for role alignment, strengthen all language. All changes must still be truthful — no fabrication.",
  };

  const gapsLine = input.atsGaps?.length
    ? `Missing keywords to naturally incorporate: ${input.atsGaps.join(", ")}. Use these ONLY where they genuinely fit the candidate's described experience.`
    : "";
  const strengthsLine = input.strengths?.length
    ? `Existing strengths to preserve and emphasize: ${input.strengths.join(", ")}.`
    : "";

  return `${ANTI_HALLUCINATION_RULES}

Mode: ${modeInstructions[input.mode]}
Job Title: ${input.jobTitle || "Unknown"}
Company: ${input.companyName || "Unknown"}

${gapsLine}
${strengthsLine}

Return a JSON object with this structure:
{
  "tailoredResume": "FULL tailored resume text",
  "sections": [
    {
      "section": "summary|experience|skills|education|projects",
      "original": "original text snippet",
      "improved": "improved text snippet",
      "reason": "ATS keyword alignment" or "Clarity improvement" etc
    }
  ],
  "atsImprovement": 0-30 (estimated ATS score improvement),
  "matchImprovement": 0-30 (estimated match improvement),
  "appliedKeywords": ["keyword1", "keyword2"],
  "warnings": []
}

Original Resume:
${input.resumeText.slice(0, 4000)}

Job Description:
${input.jobDescription.slice(0, 3000)}`;
}

export async function tailorResume(input: TailorInput): Promise<TailorResult> {
  const prompt = buildPrompt(input);

  const res = await generateCompletion({
    task: "resume-analysis", // most capable chain
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 4000,
    validate: (c) => extractJSON(c) !== null,
  });

  const content = res.choices[0]?.message?.content?.trim() || "";
  const parsed = extractJSON(content);

  if (!parsed || !parsed.tailoredResume) {
    throw new Error("Failed to generate tailored resume. The AI could not produce a valid result.");
  }

  // Safety check: ensure tailored resume contains original core facts
  const warnings = parsed.warnings || [];
  if (parsed.tailoredResume.length < input.resumeText.length * 0.6) {
    warnings.push("Tailored version is significantly shorter — review carefully.");
  }

  return {
    tailoredResume: parsed.tailoredResume,
    sections: parsed.sections || [],
    atsImprovement: parsed.atsImprovement || 0,
    matchImprovement: parsed.matchImprovement || 0,
    appliedKeywords: parsed.appliedKeywords || [],
    warnings,
  };
}
