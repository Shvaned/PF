import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { firebaseUid, name, email, dob } = await request.json();
    if (!firebaseUid) {
      return Response.json({ error: "firebaseUid required" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { firebaseUid },
      update: { name, email, dob },
      create: { firebaseUid, email, name, dob },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Register DB error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
