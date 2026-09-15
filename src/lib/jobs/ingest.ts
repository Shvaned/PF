import { prisma } from "@/lib/prisma";
import { JSearchProvider } from "./jsearch";
import { acquire, reportSuccess, reportRateLimit, reportError } from "./governor";
import { upsertJobs } from "./pool";
import type { JobResult } from "./provider";

const TARGET_JOBS = 20;

function buildIngestQueries(roleCategory: string, location?: string | null, remote?: boolean): string[] {
  const q: string[] = [];
  if (location) q.push(`${roleCategory} ${location}`);
  else if (remote) q.push(`${roleCategory} remote`);
  else q.push(roleCategory);
  if (location && remote) q.push(`${roleCategory} remote`);
  return [...new Set(q)].slice(0, 2);
}

export interface Bucket {
  roleCategory: string;
  location?: string | null;
  remote?: boolean;
}

/**
 * Ingestion plane. The only module that touches JSearch. Governor-gated and fail-closed.
 */
export async function replenishBucket(
  bucket: Bucket,
  triggerType: "threshold" | "manual" = "threshold",
): Promise<{ ok: boolean; fetched: number; reason?: string }> {
  const bucketKey = `${bucket.roleCategory}-${bucket.location || "any"}-${bucket.remote ? "remote" : "onsite"}`;
  const run = await prisma.ingestionRun.create({ data: { bucketKey, triggerType } });

  const admission = await acquire();
  if (!admission.allowed) {
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: { status: "failed", error: `governor:${admission.reason}`, finishedAt: new Date() },
    });
    return { ok: false, fetched: 0, reason: admission.reason };
  }

  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: { status: "failed", error: "no_api_key", finishedAt: new Date() },
    });
    return { ok: false, fetched: 0, reason: "no_api_key" };
  }

  const provider = new JSearchProvider(apiKey);
  const queries = buildIngestQueries(bucket.roleCategory, bucket.location, bucket.remote);
  const gathered: JobResult[] = [];
  let rateLimited = false;

  for (const q of queries) {
    if (gathered.length >= TARGET_JOBS) break;
    const result = await provider.searchJobs({ query: q, page: 1, numPages: 2 });

    if (result.rateLimited) {
      rateLimited = true;
      await reportRateLimit({ retryAfterSeconds: result.retryAfterSeconds, quotaRemaining: result.quotaRemaining });
      break;
    }
    if (result.status === 0 || result.status >= 500) {
      await reportError(String(result.status));
      break;
    }
    await reportSuccess({ quotaRemaining: result.quotaRemaining, quotaLimit: result.quotaLimit });
    gathered.push(...result.jobs);
  }

  let inserted = 0;
  let updated = 0;
  if (gathered.length > 0) {
    const res = await upsertJobs(bucket.roleCategory, gathered);
    inserted = res.inserted;
    updated = res.updated;
  }

  await prisma.ingestionRun.update({
    where: { id: run.id },
    data: {
      status: rateLimited ? "failed" : "completed",
      error: rateLimited ? "rate_limited" : null,
      fetched: gathered.length,
      inserted,
      updated,
      finishedAt: new Date(),
    },
  });

  return { ok: !rateLimited, fetched: gathered.length, reason: rateLimited ? "rate_limited" : undefined };
}
