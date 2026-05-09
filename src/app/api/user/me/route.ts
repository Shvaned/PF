import { getCurrentUser } from "@/lib/auth-helpers";
import { checkUsageLimit } from "@/lib/usage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { remaining, limit } = await checkUsageLimit(user.id);
  return Response.json({
    name: user.name,
    email: user.email,
    isPremium: user.isPremium,
    dailyUsage: user.dailyUsage,
    remaining,
    limit,
  });
}
