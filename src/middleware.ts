import { auth } from "@/auth";
import { NextResponse } from "next/server";

const AUTH_ONLY_PATHS = ["/login", "/signup", "/reset-password"];
const PUBLIC_PATHS = [...AUTH_ONLY_PATHS, "/privacy", "/terms"];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => path.startsWith(p));
  const isLoggedIn = !!req.auth?.user;

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
  if (isLoggedIn && isAuthOnly) {
    const dashUrl = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
