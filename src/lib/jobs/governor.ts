import { prisma } from "@/lib/prisma";

const PROVIDER = "jsearch";

const SAFETY_RESERVE = 5;
const MIN_COOLDOWN_MS = 60_000;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_BASE_MS = 30_000;
const CIRCUIT_MAX_MS = 15 * 60_000;
const LEASE_TIMEOUT_MS = 30_000;

export type GovernorStatus = "open" | "cooldown" | "circuit_open" | "exhausted";

export interface Admission {
  allowed: boolean;
  reason: "ok" | "cooldown" | "circuit_open" | "quota_exhausted" | "concurrency";
  retryAfterMs?: number;
}

async function getState() {
  return prisma.providerGovernor.findUnique({ where: { provider: PROVIDER } });
}

async function ensureState() {
  const existing = await getState();
  if (existing) return existing;
  try {
    return await prisma.providerGovernor.create({ data: { provider: PROVIDER } });
  } catch (e: any) {
    if (e?.code === "P2002") {
      const found = await getState();
      if (found) return found;
    }
    throw e;
  }
}

/** Fail-closed admission: reject when circuit open, cooling down, quota exhausted, or saturated. */
export async function acquire(): Promise<Admission> {
  const state = await ensureState();
  const now = Date.now();

  let inFlight = state.inFlight;
  if (inFlight > 0 && state.inFlightSince && now - state.inFlightSince.getTime() > LEASE_TIMEOUT_MS) {
    inFlight = 0; // self-heal a leaked lease from a crashed instance
  }

  if (state.circuitOpenUntil && now < state.circuitOpenUntil.getTime()) {
    return { allowed: false, reason: "circuit_open", retryAfterMs: state.circuitOpenUntil.getTime() - now };
  }
  if (state.cooldownUntil && now < state.cooldownUntil.getTime()) {
    return { allowed: false, reason: "cooldown", retryAfterMs: state.cooldownUntil.getTime() - now };
  }
  if (
    state.hasLearnedQuota &&
    state.resetAt &&
    now < state.resetAt.getTime() &&
    state.remaining <= SAFETY_RESERVE
  ) {
    return { allowed: false, reason: "quota_exhausted", retryAfterMs: state.resetAt.getTime() - now };
  }
  if (inFlight >= state.maxConcurrency) {
    return { allowed: false, reason: "concurrency" };
  }

  await prisma.providerGovernor.update({
    where: { provider: PROVIDER },
    data: { inFlight: inFlight + 1, inFlightSince: new Date() },
  });
  return { allowed: true, reason: "ok" };
}

export async function reportSuccess(rl: { quotaRemaining?: number; quotaLimit?: number }): Promise<void> {
  const state = await ensureState();
  const hasLimit = !!rl.quotaLimit && rl.quotaLimit > 0;

  await prisma.providerGovernor.update({
    where: { provider: PROVIDER },
    data: {
      inFlight: Math.max(0, state.inFlight - 1),
      consecutiveFailures: 0,
      status: "open",
      lastSuccessAt: new Date(),
      quotaLimit: hasLimit ? rl.quotaLimit! : state.quotaLimit,
      hasLearnedQuota: hasLimit ? true : state.hasLearnedQuota,
      remaining: rl.quotaRemaining !== undefined ? rl.quotaRemaining : state.remaining,
      resetAt: state.resetAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
}

export async function reportRateLimit(rl: { retryAfterSeconds?: number; quotaRemaining?: number }): Promise<void> {
  const state = await ensureState();
  const retryMs = Math.max((rl.retryAfterSeconds || 0) * 1000, MIN_COOLDOWN_MS);
  const failures = state.consecutiveFailures + 1;

  const data: Record<string, any> = {
    inFlight: Math.max(0, state.inFlight - 1),
    consecutiveFailures: failures,
    cooldownUntil: new Date(Date.now() + retryMs),
    remaining: 0,
    lastErrorAt: new Date(),
    lastErrorCode: "429",
  };

  if (failures >= CIRCUIT_FAILURE_THRESHOLD) {
    const trip = state.tripCount + 1;
    const delay = Math.min(CIRCUIT_BASE_MS * Math.pow(2, trip - 1), CIRCUIT_MAX_MS);
    data.status = "circuit_open";
    data.tripCount = trip;
    data.circuitOpenUntil = new Date(Date.now() + delay);
  } else {
    data.status = "cooldown";
  }

  await prisma.providerGovernor.update({ where: { provider: PROVIDER }, data });
}

export async function reportError(code?: string): Promise<void> {
  const state = await ensureState();
  const failures = state.consecutiveFailures + 1;

  const data: Record<string, any> = {
    inFlight: Math.max(0, state.inFlight - 1),
    consecutiveFailures: failures,
    lastErrorAt: new Date(),
    lastErrorCode: code || "network",
  };

  if (failures >= CIRCUIT_FAILURE_THRESHOLD) {
    const trip = state.tripCount + 1;
    const delay = Math.min(CIRCUIT_BASE_MS * Math.pow(2, trip - 1), CIRCUIT_MAX_MS);
    data.status = "circuit_open";
    data.tripCount = trip;
    data.circuitOpenUntil = new Date(Date.now() + delay);
  }

  await prisma.providerGovernor.update({ where: { provider: PROVIDER }, data });
}

/** Read-only availability check for the serving plane (no mutation, no external call). */
export async function getGovernorStatus(): Promise<{ status: GovernorStatus; available: boolean }> {
  const state = await ensureState();
  const now = Date.now();

  const blocked =
    (state.circuitOpenUntil && now < state.circuitOpenUntil.getTime()) ||
    (state.cooldownUntil && now < state.cooldownUntil.getTime()) ||
    (state.hasLearnedQuota &&
      state.resetAt &&
      now < state.resetAt.getTime() &&
      state.remaining <= SAFETY_RESERVE);

  return { status: state.status as GovernorStatus, available: !blocked };
}
