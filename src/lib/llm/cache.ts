import crypto from "crypto";

interface CacheEntry {
  response: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function buildCacheKey(input: { resumeText: string; jobDescription: string }): string {
  const payload = `${input.resumeText.slice(0, 500)}|${input.jobDescription.slice(0, 500)}`;
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function cacheGet(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.response;
}

export function cacheSet(key: string, response: string) {
  cache.set(key, { response, timestamp: Date.now() });
}
