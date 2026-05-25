import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const sessions = await prisma.jobRecommendationSession.findMany({
    where: { userId: user.id },
    include: { jobs: { orderBy: { score: "desc" } } },
    orderBy: { generatedAt: "desc" },
    take: 5,
  });

  return Response.json({ sessions });
}
