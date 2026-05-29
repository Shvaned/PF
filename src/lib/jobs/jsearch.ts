import type { JobSearchProvider, JobResult, SearchQuery } from "./provider";

const BASE = "https://jsearch.p.rapidapi.com";

export class JSearchProvider implements JobSearchProvider {
  private key: string;
  private host = "jsearch.p.rapidapi.com";

  constructor(apiKey: string) {
    this.key = apiKey;
  }

  async searchJobs(params: SearchQuery): Promise<JobResult[]> {
    const url = new URL(`${BASE}/search`);
    url.searchParams.set("query", params.query);
    url.searchParams.set("page", String(params.page || 1));
    url.searchParams.set("num_pages", String(params.numPages || 3));
    if (params.datePosted) url.searchParams.set("date_posted", params.datePosted);
    if (params.remoteOnly) url.searchParams.set("remote_jobs_only", "true");
    if (params.employmentTypes) url.searchParams.set("employment_types", params.employmentTypes);

    const finalUrl = url.toString();
    console.log("[JSEARCH REQUEST]", {
      url: finalUrl,
      method: "GET",
      hasKey: !!this.key,
      hasHost: !!this.host,
      params: {
        query: params.query,
        page: params.page || 1,
        numPages: params.numPages || 3,
        datePosted: params.datePosted,
        remoteOnly: params.remoteOnly,
        employmentTypes: params.employmentTypes,
      },
    });

    const res = await fetch(finalUrl, {
      headers: {
        "X-RapidAPI-Key": this.key,
        "X-RapidAPI-Host": this.host,
      },
    });

    if (res.status === 429) {
      console.warn("[JSEARCH] rate_limited");
      return [];
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "unreadable");
      console.error("[JSEARCH] error", {
        status: res.status,
        statusText: res.statusText,
        body: errBody.slice(0, 500),
        url: finalUrl,
      });
      return [];
    }

    const json = await res.json();

    // JSearch returns: { status, data: { jobs: [...] } }
    // Defensive: try data.jobs first, fall back to data (array), then raw jobs key
    const jobs: any[] = json?.data?.jobs ?? json?.jobs ?? json?.data ?? [];
    const rawCount = jobs.length;

    console.log("[JSEARCH RESPONSE]", {
      query: params.query,
      status: res.status,
      rawCount,
      firstSample: rawCount > 0 ? {
        title: jobs[0]?.job_title,
        employer: jobs[0]?.employer_name,
      } : null,
    });

    if (rawCount === 0) {
      console.warn("[JSEARCH] empty_data", { keys: Object.keys(json || {}), dataKeys: Object.keys(json?.data || {}) });
      return [];
    }

    return jobs.map((raw: any) => ({
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
    }));
  }
}
