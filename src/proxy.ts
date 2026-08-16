import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/passwords",
    "/cards",
    "/notes",
    "/health",
    "/profile",
    "/add",
    "/trash",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !token) {
    const signInUrl = new URL("/sign-in", request.url);
    // Add callbackUrl so they return to the page they were trying to visit after login
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Prevent logged-in users from accessing sign-in / sign-up pages
  if ((pathname === "/sign-in" || pathname === "/sign-up") && token) {
    return NextResponse.redirect(new URL("/passwords", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/passwords/:path*",
    "/cards/:path*",
    "/notes/:path*",
    "/health/:path*",
    "/profile/:path*",
    "/add/:path*",
    "/trash/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
