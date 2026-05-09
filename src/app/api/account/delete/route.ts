import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (sessionCookie) {
      try {
        const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!);
        const { payload } = await jwtVerify(sessionCookie, SESSION_SECRET, {
          algorithms: ["HS256"],
        });
        const idToken = payload.firebaseToken as string;

        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }
        );
      } catch {
        /* Token extraction failed, still delete DB record */
      }
    }

    await prisma.user.delete({ where: { id: user.id } });

    const response = NextResponse.json({ success: true });
    response.cookies.set("__session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
