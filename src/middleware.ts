import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password", "/privacy", "/terms"];

export default auth((req) => {
  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isLoggedIn = !!req.auth?.user;
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
  if (isLoggedIn && isPublic) {
    const dashUrl = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
