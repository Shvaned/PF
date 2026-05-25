import type { JobResult } from "./provider";

export function deduplicateJobs(jobs: JobResult[]): JobResult[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    // Priority: job_id > apply_url > title+company fingerprint
    const key = j.jobId ||
      j.applyUrl ||
      `${j.title}|${j.employer}`.toLowerCase().trim();

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
