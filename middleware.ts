import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && !session.isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/onboarding") && !session.isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-user-id", String(session.userId));
  reqHeaders.set("x-is-admin", session.isAdmin ? "1" : "0");

  return NextResponse.next({ request: { headers: reqHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
