import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { verifyFirebaseToken } from "@/lib/auth/jwt";

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!);
const COOKIE_NAME = "__session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return Response.json({ error: "Token required" }, { status: 400 });
    }

    const payload = await verifyFirebaseToken(token);
    if (!payload) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const sessionToken = await new SignJWT({
      firebaseToken: token,
      uid: payload.sub,
      firebaseExp: payload.exp,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MAX_AGE}s`)
      .sign(SESSION_SECRET);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Session creation error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return Response.json({ success: true });
}
