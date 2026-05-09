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
      await jwtVerify(sessionCookie, SESSION_SECRET, {
        algorithms: ["HS256"],
      });
      hasSession = true;
    } catch {
      // invalid or expired
    }
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
