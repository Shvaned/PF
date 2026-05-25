import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { normalizeResumeText } from "@/lib/resume";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const selectedId = (await prisma.user.findUnique({
    where: { id: user.id },
    select: { selectedResumeId: true },
  }))?.selectedResumeId;

  return Response.json({ resumes, selectedId });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { content, uploadType, fileName } = await request.json();
  if (!content || content.length < 50) {
    return Response.json({ error: "Resume too short" }, { status: 400 });
  }

  const normalized = normalizeResumeText(content);
  const title = fileName || normalized.slice(0, 80).replace(/\n/g, " ");

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      title,
      content: normalized,
      uploadType: uploadType || "paste",
      fileName: fileName || null,
    },
  });

  // Auto-select if first resume
  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { selectedResumeId: true } });
  if (!current?.selectedResumeId) {
    await prisma.user.update({ where: { id: user.id }, data: { selectedResumeId: resume.id } });
  }

  return Response.json({ resume });
}
