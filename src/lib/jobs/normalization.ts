import { getRoleQueries } from "./role-synonyms";
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
 * Builds a tiered search strategy.
 * Returns flat array ordered by priority — route handler stops when enough results found.
 *
 * Tier 1: role + top 2-3 skills + location   (most relevant)
 * Tier 2: role + location                     (balanced)
 * Tier 3: role + remote                       (remote-friendly)
 * Tier 4: role synonym expansion              (broad)
 */
export function buildSearchQueries(profile: ExtractedProfile): string[] {
  const role = normalizeRole(profile.target_roles[0]);
  const topSkills = normalizeSkills(profile.skills).slice(0, 3);
  const loc = profile.preferred_locations?.[0] || "";
  const level = profile.experience_level;
  const seen = new Set<string>();
  const queries: string[] = [];

  const levelPrefix = level === "intern" ? "intern" : level === "entry" ? "entry level" : level === "senior" ? "senior" : "";
  const roleVariants = getRoleQueries(role);

  // Tier 1: role + top 2 skills + location (limit skills to avoid overfitting)
  if (topSkills.length > 0) {
    const skillStr = topSkills.slice(0, 2).join(" ");
    if (loc) {
      queries.push(`${role} ${skillStr} ${loc}`.trim());
      if (levelPrefix) queries.push(`${levelPrefix} ${role} ${skillStr} ${loc}`.trim());
    }
    queries.push(`${role} ${skillStr}`.trim());
    if (levelPrefix) queries.push(`${levelPrefix} ${role} ${skillStr}`.trim());
  }

  // Tier 2: role + location
  if (loc) {
    queries.push(`${role} ${loc}`.trim());
    if (levelPrefix) queries.push(`${levelPrefix} ${role} ${loc}`.trim());
  }

  // Tier 3: role + remote
  if (profile.remote_ok) {
    queries.push(`${role} remote`.trim());
    if (levelPrefix) queries.push(`${levelPrefix} ${role} remote`.trim());
  }

  // Tier 4: role synonym expansion
  for (const v of roleVariants) {
    if (!seen.has(v)) {
      seen.add(v);
      queries.push(v);
      if (levelPrefix) queries.push(`${levelPrefix} ${v}`.trim());
    }
  }

  // Deduplicate preserving order
  const unique: string[] = [];
  const seenQ = new Set<string>();
  for (const q of queries) {
    const key = q.toLowerCase();
    if (!seenQ.has(key)) {
      seenQ.add(key);
      unique.push(q);
    }
  }
  return unique;
}
