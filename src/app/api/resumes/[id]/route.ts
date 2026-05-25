import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.resume.delete({ where: { id } });

  // If deleted resume was selected, auto-select next newest
  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { selectedResumeId: true } });
  if (current?.selectedResumeId === id) {
    const next = await prisma.resume.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { selectedResumeId: next?.id || null },
    });
  }

  return Response.json({ ok: true });
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { selectedResumeId: id },
  });

  return Response.json({ selectedId: id });
}
