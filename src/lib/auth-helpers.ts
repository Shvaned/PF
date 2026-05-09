import "server-only";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { verifyFirebaseToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!);
const COOKIE_NAME = "__session";

export interface AppUser {
  id: string;
  firebaseUid: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isPremium: boolean;
  dailyUsage: number;
  isGuest: boolean;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  let sessionPayload;
  try {
    const { payload } = await jwtVerify(sessionCookie, SESSION_SECRET, {
      algorithms: ["HS256"],
    });
    sessionPayload = payload;
  } catch {
    return null;
  }

  const firebaseUid = sessionPayload.uid as string;
  const firebaseToken = sessionPayload.firebaseToken as string;

  const tokenPayload = await verifyFirebaseToken(firebaseToken);
  if (!tokenPayload || tokenPayload.sub !== firebaseUid) {
    return null;
  }

  const email = tokenPayload.email ?? null;
  const name = tokenPayload.name ?? null;
  const image = tokenPayload.picture ?? null;

  let dbUser = await prisma.user.findUnique({
    where: { firebaseUid },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        name,
        image,
        emailVerified: tokenPayload.email_verified ? new Date() : null,
      },
    });
  } else {
    if (
      name !== dbUser.name ||
      email !== dbUser.email ||
      image !== dbUser.image
    ) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { name, email, image },
      });
    }
  }

  return {
    id: dbUser.id,
    firebaseUid,
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image,
    isPremium: dbUser.isPremium,
    dailyUsage: dbUser.dailyUsage,
    isGuest: dbUser.isGuest,
  };
}
