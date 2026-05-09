import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ bookmarks });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { question, guidance, analysisId } = await request.json();
  if (!question) {
    return Response.json({ error: "Question is required" }, { status: 400 });
  }

  const existing = await prisma.bookmark.findUnique({
    where: { userId_question: { userId: user.id, question } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return Response.json({ bookmarked: false });
  }

  await prisma.bookmark.create({
    data: { userId: user.id, question, guidance: guidance || null, analysisId: analysisId || null },
  });

  return Response.json({ bookmarked: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "Bookmark ID required" }, { status: 400 });

  const bookmark = await prisma.bookmark.findUnique({ where: { id } });
  if (!bookmark || bookmark.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.bookmark.delete({ where: { id } });
  return Response.json({ deleted: true });
}
