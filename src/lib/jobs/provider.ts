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

export interface JobSearchProvider {
  searchJobs(params: SearchQuery): Promise<JobResult[]>;
}
