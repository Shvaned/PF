// Pure client-side filter engine. No side effects, no API calls.
import type { JobResult } from "@/lib/jobs/provider";

export interface FilterState {
  // Server-side triggers (changing these = refetch)
  country: string | null;
  city: string | null;
  employmentTypes: string[];
  datePosted: string; // 'month' | 'week' | '3days' | 'today' | 'all'
  remoteMode: "all" | "remote" | "hybrid" | "onsite";

  // Client-side filters (instant, no refetch)
  experienceLevels: string[];  // 'intern' | 'entry' | 'mid' | 'senior'
  salaryMin: number | null;     // minimum salary threshold (0 = show all)
  skillsBoost: string[];        // skills to boost in ranking
  matchScoreMin: number;        // 0–100, 0 = show all
}

export interface FilterMeta {
  activeCount: number;
  hasServerSideChanges: boolean;
  countryOptions: string[];
  cityOptions: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  country: null,
  city: null,
  employmentTypes: [],
  datePosted: "month",
  remoteMode: "all",
  experienceLevels: [],
  salaryMin: null,
  skillsBoost: [],
  matchScoreMin: 0,
};

const COUNTRY_MAP: Record<string, string> = {
  "india": "India", "united states": "United States", "canada": "Canada",
  "uk": "UK", "united kingdom": "UK", "germany": "Germany",
  "uae": "UAE", "singapore": "Singapore", "australia": "Australia",
};

const CITY_NEARBY: Record<string, string[]> = {
  gurgaon: ["Gurgaon", "Delhi", "Noida", "Bangalore", "Pune", "Hyderabad"],
  delhi: ["Delhi", "Gurgaon", "Noida", "Bangalore", "Mumbai", "Pune"],
  noida: ["Noida", "Delhi", "Gurgaon", "Bangalore", "Hyderabad"],
  bangalore: ["Bangalore", "Hyderabad", "Chennai", "Pune", "Mumbai"],
  mumbai: ["Mumbai", "Pune", "Bangalore", "Hyderabad", "Delhi"],
  pune: ["Pune", "Mumbai", "Bangalore", "Hyderabad"],
  hyderabad: ["Hyderabad", "Bangalore", "Chennai", "Pune", "Delhi"],
  chennai: ["Chennai", "Bangalore", "Hyderabad", "Coimbatore"],
  "new york": ["New York", "San Francisco", "Seattle", "Austin", "Boston", "Chicago"],
  "san francisco": ["San Francisco", "San Jose", "Seattle", "Austin", "New York"],
  seattle: ["Seattle", "San Francisco", "Portland", "Austin", "Denver"],
  austin: ["Austin", "Dallas", "Houston", "Denver", "Seattle"],
  london: ["London", "Manchester", "Birmingham", "Edinburgh", "Dublin"],
  berlin: ["Berlin", "Munich", "Hamburg", "Amsterdam", "Frankfurt"],
  toronto: ["Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary"],
  remote: [],
};

export function buildCountryOptions(jobs: any[], profileCountry?: string | null): string[] {
  const seen = new Set<string>();
  const options: string[] = [];

  if (profileCountry) {
    const mapped = COUNTRY_MAP[profileCountry.toLowerCase()] || profileCountry;
    if (!seen.has(mapped)) { seen.add(mapped); options.push(mapped); }
  }

  for (const j of jobs) {
    const raw = j.rawData;
    const country = raw?.job_country;
    if (country && !seen.has(country)) {
      seen.add(country);
      const mapped = COUNTRY_MAP[country.toLowerCase()] || country;
      if (!seen.has(mapped)) { seen.add(mapped); options.push(mapped); }
    }
  }

  if (!seen.has("Remote / Global")) options.push("Remote / Global");
  return options.slice(0, 12);
}

export function buildCityOptions(jobs: any[], profileCity?: string | null): string[] {
  const seen = new Set<string>();
  const options: string[] = [];

  if (profileCity) {
    const nearby = CITY_NEARBY[profileCity.toLowerCase()] || [profileCity];
    for (const c of nearby) { if (!seen.has(c)) { seen.add(c); options.push(c); } }
  }

  for (const j of jobs) {
    const city = j.rawData?.job_city;
    if (city && !seen.has(city)) { seen.add(city); options.push(city); }
  }

  return options.slice(0, 15);
}

function inferSeniority(title: string): string {
  const t = title.toLowerCase();
  if (/senior|sr\.|lead|principal|staff|head of|director/i.test(t)) return "senior";
  if (/mid|intermediate/i.test(t)) return "mid";
  if (/junior|jr\.|associate|entry|grad|trainee|intern/i.test(t)) return "entry";
  return "mid";
}

function parseSalaryValue(salary: string | null): number | null {
  if (!salary) return null;
  // Try "$X – $Y" format first
  const rangeMatch = salary.match(/\$?([\d,.]+)\s*[–-]\s*\$?([\d,.]+)/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(/,/g, ""));
    return isNaN(low) ? null : low;
  }
  // Try single number
  const numMatch = salary.match(/\$?([\d,.]+)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1].replace(/,/g, ""));
    return isNaN(val) ? null : val;
  }
  return null;
}

export function applyFilters(
  jobs: (JobResult & { score: number; matchReasons?: string[] })[],
  filters: FilterState,
  profileSkills: string[] = [],
): { jobs: (JobResult & { score: number; matchReasons?: string[] })[]; activeCount: number } {
  let activeCount = 0;

  // Count active filters
  if (filters.country) activeCount++;
  if (filters.city) activeCount++;
  if (filters.employmentTypes.length > 0) activeCount++;
  if (filters.datePosted !== "month") activeCount++;
  if (filters.remoteMode !== "all") activeCount++;
  if (filters.experienceLevels.length > 0) activeCount++;
  if (filters.salaryMin !== null && filters.salaryMin > 0) activeCount++;
  if (filters.skillsBoost.length > 0) activeCount++;
  if (filters.matchScoreMin > 0) activeCount++;

  let filtered = [...jobs];

  // 0. Country filter — use searchMeta if available, else job location
  if (filters.country) {
    const targetCountry = filters.country.toLowerCase();
    filtered = filtered.filter((j: any) => {
      // Check search metadata first (most reliable)
      if (j.searchMeta?.searchCountry) {
        return j.searchMeta.searchCountry.toLowerCase() === targetCountry;
      }
      // Fall back to job rawData country
      const jobCountry = j.rawData?.job_country || "";
      return jobCountry.toLowerCase() === targetCountry ||
        j.location?.toLowerCase().includes(targetCountry);
    });
  }

  // 1. Remote mode filter (soft)
  if (filters.remoteMode !== "all") {
    filtered = filtered.filter((j) => {
      if (filters.remoteMode === "remote") return j.remote === true;
      if (filters.remoteMode === "onsite") return j.remote === false;
      // hybrid: keep all (JSearch doesn't have hybrid data), prefer non-remote
      return true;
    });
  }

  // 2. Employment type filter (soft — match or keep)
  if (filters.employmentTypes.length > 0) {
    filtered = filtered.filter((j) => {
      if (!j.employmentType) return true; // keep if unknown
      const types = filters.employmentTypes.map((t) => t.toLowerCase());
      return types.some((t) => j.employmentType!.toLowerCase().includes(t));
    });
  }

  // 3. Match score filter (hard for selected minimum)
  if (filters.matchScoreMin > 0) {
    filtered = filtered.filter((j) => j.score >= filters.matchScoreMin);
  }

  // 4. Salary filter (soft — keep jobs with missing salary, penalize them)
  const salaryThreshold = filters.salaryMin;
  if (salaryThreshold !== null && salaryThreshold > 0) {
    filtered = filtered.filter((j) => {
      const val = parseSalaryValue(j.salary);
      if (val === null) return true; // keep if salary unknown
      return val >= salaryThreshold;
    });
  }

  // 5. Experience level soft filter — penalize, don't remove
  if (filters.experienceLevels.length > 0) {
    filtered = filtered.map((j: any) => {
      // Use search metadata experience if available, else infer from title
      const exp = j.searchMeta?.searchExperience || inferSeniority(j.title);
      const matches = filters.experienceLevels.some((l) => exp === l);
      if (!matches) {
        return { ...j, score: j.score - 10 }; // penalty for experience mismatch
      }
      return j;
    });
    // Filter out jobs that dropped below 0 after penalty
    filtered = filtered.filter((j) => j.score > 0);
  }

  // 6. Skills boost — boost matching jobs
  if (filters.skillsBoost.length > 0) {
    filtered = filtered.map((j) => {
      const descLower = ((j as any).description || "").toLowerCase() + " " + j.title.toLowerCase();
      const hits = filters.skillsBoost.filter((s) => descLower.includes(s.toLowerCase())).length;
      if (hits > 0) {
        return { ...j, score: j.score + hits * 5 };
      }
      return j;
    });
  }

  // Re-sort by adjusted score
  filtered.sort((a, b) => (b.score || 0) - (a.score || 0));

  return { jobs: filtered, activeCount };
}

/** Returns which filters would trigger a server refetch */
export function hasServerSideChanges(current: FilterState, previous: FilterState): boolean {
  return (
    current.country !== previous.country ||
    current.city !== previous.city ||
    current.datePosted !== previous.datePosted ||
    current.remoteMode !== previous.remoteMode ||
    JSON.stringify(current.employmentTypes.sort()) !== JSON.stringify(previous.employmentTypes.sort())
  );
}

/** Builds query params for server refetch based on filter changes */
export function buildRefetchParams(filters: FilterState): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.country) params.country = filters.country;
  if (filters.city) params.city = filters.city;
  if (filters.datePosted !== "month") params.datePosted = filters.datePosted;
  if (filters.remoteMode !== "all") params.remoteMode = filters.remoteMode;
  if (filters.employmentTypes.length > 0) params.employmentTypes = filters.employmentTypes.join(",");
  return params;
}
