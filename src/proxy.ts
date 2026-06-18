import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "fallback_default_secret_key_1234567890_change_me_in_production";

const protectedPaths = ["/passwords", "/cards", "/post"];
const authPaths = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname starts with any protected path
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Check if pathname starts with any auth path
  const isAuthPath = authPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const token = request.cookies.get("token")?.value;
  let isValid = false;

  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jose.jwtVerify(token, secret);
      isValid = true;
    } catch (error) {
      console.warn("Invalid token in middleware:", error);
    }
  }

  // If user is accessing protected path and token is not valid, redirect to sign-in
  if (isProtected && !isValid) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    // Redirect to sign-in page
    return NextResponse.redirect(url);
  }

  // If user is accessing login/signup and token is valid, redirect to passwords dashboard
  if (isAuthPath && isValid) {
    const url = request.nextUrl.clone();
    url.pathname = "/passwords";
    return NextResponse.redirect(url);
  }

  // If request is for root page ("/") and they are logged in, automatically redirect to /passwords
  if (pathname === "/" && isValid) {
    const url = request.nextUrl.clone();
    url.pathname = "/passwords";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, except if we want to protect some later, but middleware is best for pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
