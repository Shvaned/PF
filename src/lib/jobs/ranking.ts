import type { JobResult } from "./provider";
import { normalizeRole, normalizeSkills } from "./normalization";

interface RankInput {
  jobs: JobResult[];
  profile: {
    target_roles: string[];
    skills: string[];
    location: string;
    remote_ok: boolean;
  };
}

export function rankJobs({ jobs, profile }: RankInput): JobResult[] {
  const normalizedRoles = profile.target_roles.map(normalizeRole);
  const normalizedSkills = normalizeSkills(profile.skills);

  return jobs
    .map((job) => {
      const titleLower = job.title.toLowerCase();

      // Role match: title contains target role
      const roleMatch = normalizedRoles.some((r) => titleLower.includes(r)) ? 30 : 0;

      // Skills overlap
      const skillHits = normalizedSkills.filter((s) =>
        titleLower.includes(s) || (job.description || "").toLowerCase().includes(s)
      ).length;
      const skillScore = Math.min(skillHits * 10, 30);

      // Entry-level fit
      const entryScore = /entry|junior|associate|grad|trainee|0-2/i.test(titleLower) ? 15 : 5;

      // Remote compatibility
      const remoteScore = profile.remote_ok && job.remote ? 15 : 0;

      // Recency (newer = higher)
      const recencyScore = job.datePosted ? 10 : 0;

      const score = roleMatch + skillScore + entryScore + remoteScore + recencyScore;

      return { ...job, score };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}
