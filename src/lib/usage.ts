import { prisma } from "@/lib/prisma";

const FREE_DAILY_LIMIT = 3;

export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const today = new Date().toISOString().split("T")[0];

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) return { allowed: false, remaining: 0, limit: FREE_DAILY_LIMIT };
  if (user.isPremium) return { allowed: true, remaining: -1, limit: -1 };

  if (user.usageDate !== today) {
    await prisma.user.update({
      where: { id: userId },
      data: { dailyUsage: 0, usageDate: today },
    });
    return { allowed: true, remaining: FREE_DAILY_LIMIT, limit: FREE_DAILY_LIMIT };
  }

  const remaining = FREE_DAILY_LIMIT - user.dailyUsage;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit: FREE_DAILY_LIMIT,
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isPremium) return;

  if (user.usageDate !== today) {
    await prisma.user.update({
      where: { id: userId },
      data: { dailyUsage: 1, usageDate: today },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { dailyUsage: { increment: 1 } },
    });
  }
}

export async function logUsageAction(userId: string, action: string): Promise<void> {
  await prisma.usageLog.create({
    data: { userId, action },
  });
}

export { FREE_DAILY_LIMIT };
