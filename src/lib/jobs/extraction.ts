import { generateCompletion } from "@/lib/llm/router";
import { extractJSON } from "@/lib/llm/validation";

export interface ExtractedProfile {
  target_roles: string[];
  skills: string[];
  location: string;
  remote_ok: boolean;
  experience_level: string;
}

export async function extractProfile(resumeContent: string): Promise<ExtractedProfile> {
  const prompt = `You are a job matching engine for entry-level candidates (0-2 years experience).

Extract structured data from this resume. Return ONLY a JSON object:

{
  "target_roles": ["role1", "role2"],
  "skills": ["skill1", "skill2"],
  "location": "City or Remote",
  "remote_ok": true/false,
  "experience_level": "entry"
}

Rules:
- Infer 2-3 most suitable job titles from the resume (e.g. "frontend developer", "data analyst")
- List 3-6 specific technical skills mentioned
- Extract preferred location if mentioned, otherwise default to "Remote"
- Set remote_ok to true unless the resume explicitly requires on-site
- Always set experience_level to "entry"

Resume:
${resumeContent.slice(0, 3000)}`;

  const res = await generateCompletion({
    task: "job-extraction",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 500,
    validate: (c) => extractJSON(c) !== null,
  });

  const content = res.choices[0]?.message?.content?.trim() || "";
  const parsed = extractJSON(content);
  if (!parsed) throw new Error("Failed to parse extraction response");

  return {
    target_roles: parsed.target_roles?.slice(0, 3) || [],
    skills: parsed.skills?.slice(0, 6) || [],
    location: parsed.location || "Remote",
    remote_ok: parsed.remote_ok !== false,
    experience_level: "entry",
  };
}
