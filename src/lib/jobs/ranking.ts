import type { JobResult } from "./provider";
import { normalizeRole, normalizeSkills } from "./normalization";
import type { ExtractedProfile } from "./extraction";

interface RankInput {
  jobs: JobResult[];
  profile: ExtractedProfile;
}

export function rankJobs({ jobs, profile }: RankInput): (JobResult & { score: number; matchReasons: string[] })[] {
  const normalizedRoles = profile.target_roles.map(normalizeRole);
  const normalizedSkills = normalizeSkills(profile.skills);
  const candidateLocs = (profile.preferred_locations || []).map((l) => l.toLowerCase());
  const candidateRemote = profile.remote_ok;
  const expLevel = profile.experience_level;

  return jobs
    .map((job) => {
      const titleLower = job.title.toLowerCase();
      const descLower = (job.description || "").toLowerCase();
      const jobLocLower = (job.location || "").toLowerCase();
      const reasons: string[] = [];

      // 1. Role match (0–25)
      let roleScore = 0;
      for (const r of normalizedRoles) {
        if (titleLower.includes(r)) {
          roleScore = 25;
          reasons.push(r);
          break;
        }
      }
      if (roleScore === 0) {
        // Partial: check if any role word matches
        for (const r of normalizedRoles) {
          const words = r.split(/\s+/);
          if (words.some((w) => titleLower.includes(w))) {
            roleScore = 12;
            break;
          }
        }
      }

      // 2. Skills overlap (0–25)
      const matchedSkills: string[] = [];
      for (const s of normalizedSkills) {
        if (titleLower.includes(s) || descLower.includes(s)) {
          matchedSkills.push(s);
        }
      }
      const skillScore = Math.min(matchedSkills.length * 8, 25);
      reasons.push(...matchedSkills.slice(0, 3).map((s) => s));

      // 3. Location match (0–15)
      let locScore = 0;
      if (candidateLocs.length > 0) {
        const locMatch = candidateLocs.some((l) => jobLocLower.includes(l));
        if (locMatch) {
          locScore = 15;
          reasons.push("Location match");
        }
      }
      if (locScore === 0 && candidateRemote && job.remote) {
        locScore = 12;
        reasons.push("Remote-friendly");
      }

      // 4. Experience fit (0–15)
      let expScore = 0;
      const isEntryTitle = /entry|junior|associate|grad|trainee|intern|0-2/i.test(titleLower);
      const isSeniorTitle = /senior|sr\.|lead|principal|staff|head|director|vp|manager/i.test(titleLower);

      if (expLevel === "intern" || expLevel === "entry") {
        expScore = isEntryTitle ? 15 : isSeniorTitle ? -10 : 5;
        if (isEntryTitle) reasons.push("Entry-level");
      } else if (expLevel === "mid") {
        expScore = isSeniorTitle ? 5 : isEntryTitle ? 5 : 10;
        reasons.push("Mid-level fit");
      } else {
        expScore = isSeniorTitle ? 15 : 5;
        if (isSeniorTitle) reasons.push("Senior role");
      }

      // 5. Remote preference (0–10)
      const remoteScore = candidateRemote && job.remote ? 10 : 0;

      // 6. Recency (0–10)
      const recencyScore = job.datePosted ? 10 : 5;

      const score = Math.max(0, roleScore + skillScore + locScore + expScore + remoteScore + recencyScore);

      return { ...job, score, matchReasons: [...new Set(reasons)].slice(0, 5) };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}
