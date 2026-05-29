import type { ExtractedProfile } from "./extraction";

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

export function buildCacheKey(profile: ExtractedProfile): string {
  const role = profile.target_roles[0] || "general";
  const normalized = normalizeRole(role).replace(/\s+/g, "-");
  const topSkills = normalizeSkills(profile.skills).slice(0, 3).join("-");
  const loc = profile.preferred_locations?.[0]?.replace(/\s+/g, "-").toLowerCase() || "";
  const parts = [normalized];
  if (topSkills) parts.push(topSkills);
  if (loc) parts.push(loc);
  if (profile.remote_ok) parts.push("remote");
  parts.push(profile.experience_level || "entry");
  return parts.join("-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Generates EXACTLY 3 broad queries for JSearch.
 * Search broad, rank narrow. Never more than 3 API calls.
 *
 * Primary:   role + location
 * Secondary: broader role + location (or remote)
 * Fallback:  generic "software engineer"
 */
export function buildSearchQueries(profile: ExtractedProfile): string[] {
  const role = normalizeRole(profile.target_roles[0]);
  const loc = profile.preferred_locations?.[0] || "";
  const queries: string[] = [];

  // Primary: role + location
  if (loc) {
    queries.push(`${role} ${loc}`);
  } else {
    queries.push(role);
    if (profile.remote_ok) queries.push(`${role} remote`);
  }

  // Secondary: broader role (use second target role if different, else generic alternative)
  const secondRole = profile.target_roles.length > 1
    ? normalizeRole(profile.target_roles[1])
    : role === "software developer" ? "software engineer" : "software developer";
  if (secondRole !== role) {
    if (loc) {
      queries.push(`${secondRole} ${loc}`);
    } else {
      queries.push(secondRole);
    }
  } else if (!profile.remote_ok && loc) {
    // Add a remote variant as second query
    queries.push(`${role} remote`);
  }

  // Fallback: always "software engineer" (broadest reliable JSearch query)
  if (!queries.some((q) => q.includes("software engineer"))) {
    queries.push("software engineer");
  }

  // Deduplicate
  return [...new Set(queries)].slice(0, 3);
}
