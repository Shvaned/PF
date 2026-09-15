import { prisma } from "@/lib/prisma";
import type { JobResult } from "./provider";
import type { ExtractedProfile } from "./extraction";
import { normalizeRole } from "./normalization";

const BUCKET_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const MIN_JOBS = 10;
const POOL_READ_LIMIT = 200;
const JOB_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function roleCategoryFor(profile: ExtractedProfile): string {
  return normalizeRole(profile.target_roles[0] || "software developer");
}

export async function getOrCreateSearchIntent(cacheKey: string, profile: ExtractedProfile) {
  const existing = await prisma.searchIntent.findUnique({ where: { cacheKey } });
  if (existing) return existing;

  try {
    return await prisma.searchIntent.create({
      data: {
        cacheKey,
        roleCategory: roleCategoryFor(profile),
        location: profile.preferred_locations?.[0] || null,
        remote: profile.remote_ok,
        experience: profile.experience_level,
        skills: JSON.stringify(profile.skills),
        extractedData: JSON.stringify(profile),
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      const found = await prisma.searchIntent.findUnique({ where: { cacheKey } });
      if (found) return found;
    }
    throw e;
  }
}

function safeParse(raw: string | null | undefined): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function poolRowToJob(row: any): JobResult {
  return {
    jobId: row.externalId,
    title: row.title,
    employer: row.employer,
    location: row.location,
    remote: row.remote,
    salary: row.salary,
    employmentType: row.employmentType,
    description: row.description,
    shortDescription: row.shortDescription,
    applyUrl: row.applyUrl,
    source: row.source,
    datePosted: row.datePosted,
    rawData: safeParse(row.rawData),
  };
}

export async function readPool(roleCategory: string): Promise<JobResult[]> {
  const now = new Date();
  const rows = await prisma.jobPool.findMany({
    where: {
      roleCategory,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { lastSeenAt: "desc" },
    take: POOL_READ_LIMIT,
  });
  return rows.map(poolRowToJob);
}

export async function getBucketState(roleCategory: string): Promise<{ stale: boolean; thin: boolean; count: number }> {
  const now = new Date();
  const rows = await prisma.jobPool.findMany({
    where: {
      roleCategory,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true, lastSeenAt: true },
    orderBy: { lastSeenAt: "desc" },
    take: MIN_JOBS,
  });

  const newest = rows[0]?.lastSeenAt;
  const stale = !newest || Date.now() - newest.getTime() > BUCKET_TTL_MS;
  const thin = rows.length < MIN_JOBS;
  return { stale, thin, count: rows.length };
}

/**
 * Dedupe jobs into the shared pool by (source, externalId). Neon-safe: no upsert,
 * no createMany, no transactions — sequential single-record findUnique → create/update.
 */
export async function upsertJobs(
  roleCategory: string,
  jobs: JobResult[],
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;
  const batchSize = 10;

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (j) => {
        const source = j.source || "jsearch";
        const externalId = j.jobId || j.applyUrl || `${j.title}|${j.employer}`.toLowerCase().trim();
        if (!externalId) return;

        const raw = j.rawData || {};
        const country = raw?.job_country || null;
        const city = raw?.job_city || null;

        const existing = await prisma.jobPool.findUnique({
          where: { source_externalId: { source, externalId } },
        });

        if (existing) {
          await prisma.jobPool.update({
            where: { id: existing.id },
            data: { lastSeenAt: new Date() },
          });
          updated++;
        } else {
          await prisma.jobPool.create({
            data: {
              source,
              externalId,
              title: j.title || "Untitled",
              employer: j.employer || "Unknown",
              roleCategory,
              city,
              country,
              location: j.location || "Remote",
              remote: j.remote ?? false,
              salary: typeof j.salary === "string" ? j.salary : null,
              employmentType: j.employmentType || null,
              description: j.description?.slice(0, 5000) || null,
              shortDescription: j.shortDescription || null,
              applyUrl: j.applyUrl || null,
              datePosted: j.datePosted || null,
              lastSeenAt: new Date(),
              expiresAt: new Date(Date.now() + JOB_RETENTION_MS),
              rawData: raw ? JSON.stringify(raw) : null,
            },
          });
          inserted++;
        }
      }),
    );
  }

  return { inserted, updated };
}
