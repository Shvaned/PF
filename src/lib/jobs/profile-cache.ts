import { extractProfile, type ExtractedProfile } from "./extraction";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CachedProfile {
  data: ExtractedProfile;
  at: number;
}

// In-memory, keyed by resumeId + updatedAt so a resume edit invalidates the entry.
const cache = new Map<string, CachedProfile>();

export async function getOrExtractProfile(
  resume: { id: string; content: string; updatedAt?: Date | null; createdAt: Date },
  opts: { force?: boolean } = {},
): Promise<{ profile: ExtractedProfile; cached: boolean }> {
  const key = `${resume.id}-${resume.updatedAt?.getTime() || resume.createdAt.getTime()}`;
  const hit = cache.get(key);

  if (hit && !opts.force && Date.now() - hit.at < CACHE_TTL) {
    return { profile: hit.data, cached: true };
  }

  const profile = await extractProfile(resume.content);
  cache.set(key, { data: profile, at: Date.now() });
  return { profile, cached: false };
}

/** Best-effort parse of a persisted extractedData JSON string. */
export function parseExtractedData(raw: string | null | undefined): ExtractedProfile | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExtractedProfile;
  } catch {
    return null;
  }
}
