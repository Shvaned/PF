import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!);
const COOKIE_NAME = "__session";

const PROTECTED_PATHS = [
  "/dashboard",
  "/analyze",
  "/prep",
  "/mock-interview",
  "/history",
  "/settings",
  "/premium",
];

const AUTH_PATHS = ["/onboarding", "/signin", "/register", "/verify-email"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;
  let hasSession = false;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify<{ firebaseExp: number }>(
        sessionCookie,
        SESSION_SECRET,
        { algorithms: ["HS256"] }
      );

      // The HS256 wrapper lives 7 days, but the Firebase token inside
      // expires after 1 hour. Check the embedded expiry so stale
      // tokens don't cause redirect loops between auth ↔ protected pages.
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.firebaseExp && payload.firebaseExp > nowSec) {
        hasSession = true;
      }
      // If Firebase token expired, fall through to clear the cookie below
    } catch {
      // invalid signature or expired HS256 wrapper — treat as no session
    }
  }

  // Clear stale session cookie when Firebase token inside has expired
  // but the HS256 wrapper is still valid. This prevents the old cookie
  // from causing future redirect loops.
  if (!hasSession && sessionCookie) {
    const response = NextResponse.next();
    response.cookies.delete(COOKIE_NAME);
    if (isProtectedRoute(pathname)) {
      const redirect = NextResponse.redirect(new URL("/onboarding", req.url));
      redirect.cookies.delete(COOKIE_NAME);
      return redirect;
    }
    return response;
  }

  if (isAuthPage(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtectedRoute(pathname) && !hasSession) {
    const response = NextResponse.redirect(new URL("/onboarding", req.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
