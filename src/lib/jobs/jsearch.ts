import type { JobSearchProvider, JobResult, SearchQuery, JobSearchResult } from "./provider";

const BASE = "https://jsearch.p.rapidapi.com";
const EXTERNAL_TIMEOUT_MS = 8000;

function parseRateLimitHeaders(headers: Headers): {
  retryAfterSeconds?: number;
  quotaRemaining?: number;
  quotaLimit?: number;
} {
  const retryAfter = headers.get("retry-after");
  const remaining =
    headers.get("x-ratelimit-requests-remaining") ?? headers.get("x-ratelimit-remaining");
  const limit =
    headers.get("x-ratelimit-requests-limit") ?? headers.get("x-ratelimit-limit");

  const out: { retryAfterSeconds?: number; quotaRemaining?: number; quotaLimit?: number } = {};
  if (retryAfter) {
    const n = parseInt(retryAfter, 10);
    if (!isNaN(n)) out.retryAfterSeconds = n;
  }
  if (remaining) {
    const n = parseInt(remaining, 10);
    if (!isNaN(n)) out.quotaRemaining = n;
  }
  if (limit) {
    const n = parseInt(limit, 10);
    if (!isNaN(n)) out.quotaLimit = n;
  }
  return out;
}

export class JSearchProvider implements JobSearchProvider {
  private key: string;
  private host = "jsearch.p.rapidapi.com";

  constructor(apiKey: string) {
    this.key = apiKey;
  }

  async searchJobs(params: SearchQuery): Promise<JobSearchResult> {
    const url = new URL(`${BASE}/search`);
    url.searchParams.set("query", params.query);
    url.searchParams.set("page", String(params.page || 1));
    url.searchParams.set("num_pages", String(params.numPages || 3));
    if (params.datePosted) url.searchParams.set("date_posted", params.datePosted);
    if (params.remoteOnly) url.searchParams.set("remote_jobs_only", "true");
    if (params.employmentTypes) url.searchParams.set("employment_types", params.employmentTypes);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);

    try {
      const res = await fetch(url.toString(), {
        headers: {
          "X-RapidAPI-Key": this.key,
          "X-RapidAPI-Host": this.host,
        },
        signal: controller.signal,
      });

      const rl = parseRateLimitHeaders(res.headers);

      if (res.status === 429) {
        console.warn("[JSEARCH] rate_limited", { retryAfter: rl.retryAfterSeconds, remaining: rl.quotaRemaining });
        return { jobs: [], rateLimited: true, status: 429, ...rl };
      }

      if (!res.ok) {
        console.error("[JSEARCH] error", { status: res.status, statusText: res.statusText });
        return { jobs: [], rateLimited: false, status: res.status, ...rl };
      }

      const json = await res.json();
      // JSearch returns: { status, data: { jobs: [...] } }
      const rawJobs: any[] = json?.data?.jobs ?? json?.jobs ?? json?.data ?? [];
      const jobs = rawJobs.map((raw: any) => this.mapJob(raw));
      return { jobs, rateLimited: false, status: res.status, ...rl };
    } catch (err: any) {
      const aborted = err?.name === "AbortError";
      console.error("[JSEARCH] request_failed", { aborted, message: err?.message });
      return { jobs: [], rateLimited: false, status: aborted ? 408 : 0 };
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapJob(raw: any): JobResult {
    return {
      jobId: raw.job_id || "",
      title: raw.job_title || "Untitled",
      employer: raw.employer_name || "Unknown",
      location: raw.job_city && raw.job_country
        ? `${raw.job_city}, ${raw.job_country}`
        : raw.job_country || "Remote",
      remote: raw.job_is_remote ?? false,
      salary: raw.job_salary_string
        ?? (raw.job_min_salary && raw.job_max_salary
          ? `$${raw.job_min_salary} – $${raw.job_max_salary}`
          : null),
      employmentType: raw.job_employment_type || null,
      description: raw.job_description || null,
      shortDescription: raw.job_highlights?.summary || null,
      applyUrl: raw.job_apply_link || raw.job_google_link || null,
      source: "jsearch",
      datePosted: raw.job_posted_at_datetime_utc || raw.job_posted_at || null,
      rawData: raw,
    };
  }
}
