import { getCurrentUser } from "@/lib/auth-helpers";
import { replenishBucket } from "@/lib/jobs/ingest";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  let body: { roleCategory?: string; location?: string | null; remote?: boolean } = {};
  try {
    body = (await request.json().catch(() => ({}))) || {};
  } catch {}

  const roleCategory = body.roleCategory?.trim();
  if (!roleCategory) {
    return Response.json({ error: "roleCategory is required" }, { status: 400 });
  }

  const result = await replenishBucket(
    { roleCategory, location: body.location || null, remote: body.remote ?? false },
    "manual",
  );

  if (!result.ok) {
    return Response.json({ ok: false, reason: result.reason }, { status: 503 });
  }

  return Response.json({ ok: true, fetched: result.fetched });
}
