import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard"];
const guestOnlyPaths = ["/login", "/register"];

export function middleware(request) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const needsAuth = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const guestOnly = guestOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (needsAuth && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (guestOnly && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
