import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getProfile, getAllCompanyNames } from "@/lib/company-profiles";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const userCompanies = await prisma.targetCompany.findMany({
      where: { userId: user.id },
      orderBy: { priority: "desc" },
    });

    return Response.json({
      companies: getAllCompanyNames(),
      userTargets: userCompanies,
    });
  } catch (error: any) {
    return Response.json({ error: "Failed to load companies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const { companyName, companyType, targetRole } = await request.json();
    const profile = getProfile(companyName);

    const company = await prisma.targetCompany.upsert({
      where: { userId_companyName: { userId: user.id, companyName } },
      update: { targetRole: targetRole || null, companyType: profile?.type || companyType || "product" },
      create: {
        userId: user.id,
        companyName,
        companyType: profile?.type || companyType || "product",
        targetRole: targetRole || null,
        experienceLevel: "entry",
      },
    });

    return Response.json({ company, profile });
  } catch (error: any) {
    return Response.json({ error: "Failed to save company" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const { companyName } = await request.json();
    await prisma.targetCompany.deleteMany({
      where: { userId: user.id, companyName },
    });
    return Response.json({ deleted: true });
  } catch {
    return Response.json({ error: "Failed to remove company" }, { status: 500 });
  }
}
