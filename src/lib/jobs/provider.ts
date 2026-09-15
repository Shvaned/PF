export interface JobResult {
  jobId: string;
  title: string;
  employer: string;
  location: string;
  remote: boolean;
  salary: string | null;
  employmentType: string | null;
  description: string | null;
  shortDescription: string | null;
  applyUrl: string | null;
  source: string;
  datePosted: string | null;
  score?: number;
  matchReasons?: string[];
  rawData: any;
}

export interface SearchQuery {
  query: string;
  page?: number;
  numPages?: number;
  datePosted?: "all" | "today" | "3days" | "week" | "month";
  remoteOnly?: boolean;
  employmentTypes?: string;
}

/**
 * A single provider call result. Never collapses failure into `jobs: []` —
 * the caller can distinguish "no results" from "rate limited" from "error".
 */
export interface JobSearchResult {
  jobs: JobResult[];
  rateLimited: boolean;
  status: number; // 200, 429, 5xx, or 0 for network/timeout
  retryAfterSeconds?: number;
  quotaRemaining?: number;
  quotaLimit?: number;
}

export interface JobSearchProvider {
  searchJobs(params: SearchQuery): Promise<JobSearchResult>;
}
