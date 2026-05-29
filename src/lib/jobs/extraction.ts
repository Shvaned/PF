import { generateCompletion } from "@/lib/llm/router";
import { extractJSON } from "@/lib/llm/validation";

export interface ExtractedProfile {
  target_roles: string[];
  skills: string[];
  location: string;
  preferred_locations: string[];
  remote_ok: boolean;
  experience_level: "intern" | "entry" | "mid" | "senior";
  industries: string[];
  keywords: string[];
}

export async function extractProfile(resumeContent: string): Promise<ExtractedProfile> {
  const prompt = `You are a job matching engine. Analyze this resume and extract structured data for finding the best-fit jobs.

Return ONLY a JSON object with these fields:

{
  "target_roles": ["most specific role", "second role", "third role"],
  "skills": ["skill1", "skill2", ...],
  "preferred_locations": ["city or region"],
  "remote_ok": true/false,
  "experience_level": "intern" | "entry" | "mid" | "senior",
  "industries": ["industry1"],
  "keywords": ["keyword1", "keyword2"]
}

RULES:
- target_roles: 2-3 job titles that best match this resume. Be specific (e.g. "backend developer", "data analyst", "react developer"). Do NOT use vague titles like "engineer".
- skills: 3-8 specific technical skills mentioned (languages, frameworks, tools, databases). Order by prominence.
- preferred_locations: Extract city/country/region from resume if present. Check address, education, work history, or explicit location mentions. If the resume says "Delhi, India" return ["Delhi", "India"]. If remote is preferred, return []. Be accurate — never guess US locations for non-US resumes.
- remote_ok: true unless the resume explicitly requires on-site only.
- experience_level: Infer from resume evidence:
  * "intern" — still a student, internship only, no full-time experience
  * "entry" — 0-2 years professional experience, recent graduate
  * "mid" — 2-5 years professional experience
  * "senior" — 5+ years professional experience
- industries: 1-2 industries the candidate seems focused on (e.g. "fintech", "healthcare", "e-commerce", "SaaS"). If unclear, use ["technology"].
- keywords: 3-5 search-friendly terms from the resume (e.g. "python", "AWS", "React", "agile"). These help find matching jobs.

Resume:
${resumeContent.slice(0, 4000)}`;

  const res = await generateCompletion({
    task: "job-extraction",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 600,
    validate: (c) => extractJSON(c) !== null,
  });

  const content = res.choices[0]?.message?.content?.trim() || "";
  const parsed = extractJSON(content);
  if (!parsed) throw new Error("Failed to parse extraction response");

  const experience = parsed.experience_level?.toLowerCase() || "entry";
  const validLevels = ["intern", "entry", "mid", "senior"];

  console.log("[JOBS] extracted_profile", {
    roles: parsed.target_roles?.slice(0, 3),
    skills: parsed.skills?.length,
    locations: parsed.preferred_locations,
    experience: experience,
    industries: parsed.industries,
  });

  return {
    target_roles: parsed.target_roles?.slice(0, 3) || [],
    skills: parsed.skills?.slice(0, 8) || [],
    location: parsed.preferred_locations?.[0] || "Remote",
    preferred_locations: parsed.preferred_locations?.slice(0, 3) || [],
    remote_ok: parsed.remote_ok !== false,
    experience_level: validLevels.includes(experience) ? experience : "entry",
    industries: parsed.industries?.slice(0, 2) || ["technology"],
    keywords: parsed.keywords?.slice(0, 5) || [],
  };
}
