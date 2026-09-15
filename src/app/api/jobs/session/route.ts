import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { readPool } from "@/lib/jobs/pool";
import { rankJobs } from "@/lib/jobs/ranking";
import { parseExtractedData } from "@/lib/jobs/profile-cache";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const sessions = await prisma.jobRecommendationSession.findMany({
    where: { userId: user.id },
    orderBy: { refreshedAt: "desc" },
    take: 5,
  });

  const out = [];
  for (const s of sessions) {
    let jobs: any[] = [];
    let intent = null;
    if (s.searchIntentId) {
      intent = await prisma.searchIntent.findUnique({ where: { id: s.searchIntentId } });
    }
    if (intent) {
      const poolJobs = await readPool(intent.roleCategory);
      const profile =
        parseExtractedData(s.extractedData) || parseExtractedData(intent.extractedData);
      jobs = profile ? rankJobs({ jobs: poolJobs, profile }) : poolJobs;
    }
    out.push({ ...s, jobs });
  }

  return Response.json({ sessions: out });
}
