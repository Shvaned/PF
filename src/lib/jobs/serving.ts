import { buildCacheKey } from "./normalization";
import { getOrExtractProfile, parseExtractedData } from "./profile-cache";
import { getOrCreateSearchIntent, readPool, getBucketState, roleCategoryFor } from "./pool";
import { rankJobs } from "./ranking";
import type { ExtractedProfile } from "./extraction";
import type { JobResult } from "./provider";

export interface ServeResult {
  jobs: (JobResult & { score: number; matchReasons?: string[] })[];
  profile: ExtractedProfile;
  roleCategory: string;
  cacheKey: string;
  intentId: string;
  stale: boolean;
  thin: boolean;
  needsReplenishment: boolean;
  temporarilyUnavailable: boolean;
}

interface ServeOptions {
  resume: { id: string; content: string; updatedAt?: Date | null; createdAt: Date };
  existingExtractedData?: string | null;
  filterOverrides?: { country?: string; city?: string; remoteMode?: string };
}

function cloneProfile(p: ExtractedProfile): ExtractedProfile {
  return {
    target_roles: [...(p.target_roles || [])],
    skills: [...(p.skills || [])],
    location: p.location,
    preferred_locations: [...(p.preferred_locations || [])],
    remote_ok: p.remote_ok,
    experience_level: p.experience_level,
    industries: [...(p.industries || [])],
    keywords: [...(p.keywords || [])],
  };
}

/**
 * Serving plane. Performs only: profile/intent resolution, DB reads, local ranking.
 * It never calls an external job provider or performs any network fetch.
 */
export async function recommendFromPool(opts: ServeOptions): Promise<ServeResult> {
  const { resume, existingExtractedData, filterOverrides } = opts;

  // 1. Resolve profile (DB persisted → in-memory → LLM, one extraction at most)
  let profile: ExtractedProfile;
  const persisted = parseExtractedData(existingExtractedData);
  if (persisted) {
    profile = cloneProfile(persisted);
  } else {
    const { profile: p } = await getOrExtractProfile(resume);
    profile = cloneProfile(p);
  }

  // 2. Apply filter overrides (intent resolution only — ranking is local)
  if (filterOverrides?.country) {
    profile.preferred_locations = [filterOverrides.country];
    if (filterOverrides.city) profile.preferred_locations.unshift(filterOverrides.city);
  }
  if (filterOverrides?.remoteMode === "remote") profile.remote_ok = true;
  if (filterOverrides?.remoteMode === "onsite") profile.remote_ok = false;

  // 3. Intent resolution
  const cacheKey = buildCacheKey(profile);
  const roleCategory = roleCategoryFor(profile);
  const intent = await getOrCreateSearchIntent(cacheKey, profile);

  // 4. Read the shared pool (local)
  const poolJobs = await readPool(roleCategory);

  // 5. Rank locally — the six-dimension algorithm is the personalization mechanism
  const ranked = rankJobs({ jobs: poolJobs, profile });

  // 6. Bucket freshness for replenishment decision
  const { stale, thin } = await getBucketState(roleCategory);

  return {
    jobs: ranked,
    profile,
    roleCategory,
    cacheKey,
    intentId: intent.id,
    stale,
    thin,
    needsReplenishment: stale || thin,
    temporarilyUnavailable: ranked.length === 0,
  };
}
