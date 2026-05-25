const CANONICAL_MAP: Record<string, string> = {
  "frontend engineer": "frontend developer",
  "frontend software engineer": "frontend developer",
  "ui engineer": "frontend developer",
  "ui developer": "frontend developer",
  "web developer": "frontend developer",
  "react developer": "frontend developer",
  "vue developer": "frontend developer",
  "angular developer": "frontend developer",
  "backend engineer": "backend developer",
  "backend software engineer": "backend developer",
  "api developer": "backend developer",
  "server developer": "backend developer",
  "fullstack engineer": "fullstack developer",
  "full stack engineer": "fullstack developer",
  "full stack developer": "fullstack developer",
  "software engineer": "software developer",
  "devops engineer": "devops engineer",
  "platform engineer": "devops engineer",
  "sre": "devops engineer",
  "data engineer": "data engineer",
  "data scientist": "data scientist",
  "data analyst": "data analyst",
  "ml engineer": "machine learning engineer",
  "machine learning engineer": "machine learning engineer",
  "mobile developer": "mobile developer",
  "ios developer": "mobile developer",
  "android developer": "mobile developer",
  "qa engineer": "qa engineer",
  "test engineer": "qa engineer",
  "product manager": "product manager",
  "ux designer": "ux designer",
  "ui designer": "ux designer",
  "graphic designer": "ux designer",
};

export function normalizeRole(role: string): string {
  const lowered = role.toLowerCase().trim();
  return CANONICAL_MAP[lowered] || lowered;
}

export function normalizeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  return skills
    .map((s) => s.toLowerCase().trim())
    .filter((s) => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
}

export function buildCacheKey(profile: {
  target_roles: string[];
  skills: string[];
  location: string;
  remote_ok: boolean;
}): string {
  const role = profile.target_roles[0] || "general";
  const normalized = normalizeRole(role).replace(/\s+/g, "-");
  const topSkills = normalizeSkills(profile.skills).slice(0, 3).join("-");
  const parts = [normalized];
  if (topSkills) parts.push(topSkills);
  if (profile.remote_ok) parts.push("remote");
  parts.push("entry");
  return parts.join("-").replace(/[^a-z0-9-]/g, "");
}

export function buildSearchQueries(profile: {
  target_roles: string[];
  skills: string[];
  location: string;
  remote_ok: boolean;
}): string[] {
  const role = normalizeRole(profile.target_roles[0]);
  const skills = normalizeSkills(profile.skills).slice(0, 3);
  const queries: string[] = [];

  // Query 1: high precision (role + skills + remote + entry level)
  queries.push(`${role} ${skills.join(" ")} entry level`.trim());

  // Query 2: broader fallback (role only)
  if (profile.target_roles.length > 1 || skills.length > 0) {
    queries.push(`${role} entry level`.trim());
  }

  // Query 3: remote if applicable
  if (profile.remote_ok) {
    queries.push(`${role} remote entry level`.trim());
  }

  return queries;
}
