/**
 * Role → search query variants for broad retrieval.
 * First entry is the primary query; remaining are fallbacks in priority order.
 * Search broad, rank narrow — scoring handles relevance after retrieval.
 */

const ROLE_SYNONYMS: Record<string, string[]> = {
  "backend developer": [
    "backend developer",
    "backend engineer",
    "backend software engineer",
    "software engineer",
    "python developer",
    "java developer",
    "junior software engineer",
    "software developer",
  ],
  "frontend developer": [
    "frontend developer",
    "frontend engineer",
    "software engineer",
    "react developer",
    "javascript developer",
    "web developer",
    "ui developer",
    "junior software engineer",
  ],
  "fullstack developer": [
    "full stack developer",
    "full stack engineer",
    "software engineer",
    "full stack software engineer",
    "web developer",
    "fullstack engineer",
  ],
  "software developer": [
    "software developer",
    "software engineer",
    "junior software engineer",
    "junior software developer",
    "systems engineer",
    "application developer",
  ],
  "data analyst": [
    "data analyst",
    "data scientist",
    "business analyst",
    "business intelligence analyst",
    "data specialist",
    "reporting analyst",
  ],
  "data engineer": [
    "data engineer",
    "software engineer",
    "data architect",
    "ETL developer",
    "database developer",
    "big data engineer",
  ],
  "data scientist": [
    "data scientist",
    "machine learning engineer",
    "data analyst",
    "AI engineer",
    "research scientist",
    "statistical analyst",
  ],
  "devops engineer": [
    "devops engineer",
    "cloud engineer",
    "site reliability engineer",
    "systems engineer",
    "platform engineer",
    "infrastructure engineer",
  ],
  "machine learning engineer": [
    "machine learning engineer",
    "AI engineer",
    "data scientist",
    "software engineer",
    "deep learning engineer",
    "ML engineer",
  ],
  "mobile developer": [
    "mobile developer",
    "iOS developer",
    "android developer",
    "software engineer",
    "mobile engineer",
    "react native developer",
  ],
  "qa engineer": [
    "qa engineer",
    "quality assurance engineer",
    "test engineer",
    "software test engineer",
    "automation engineer",
    "quality engineer",
  ],
  "product manager": [
    "product manager",
    "product owner",
    "technical product manager",
    "associate product manager",
    "program manager",
    "project manager",
  ],
  "ux designer": [
    "ux designer",
    "ui designer",
    "product designer",
    "UI/UX designer",
    "visual designer",
    "interaction designer",
  ],
};

/** Guaranteed broad fallback when all role-specific queries return 0 results. */
export const DEFAULT_QUERIES = [
  "software engineer",
  "software developer",
  "backend engineer",
  "full stack engineer",
];

export function getRoleQueries(role: string): string[] {
  const key = role.toLowerCase().trim();
  return ROLE_SYNONYMS[key] || [role];
}
