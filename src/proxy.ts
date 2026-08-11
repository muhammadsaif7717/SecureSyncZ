import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Upstash Redis & Rate Limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// 5 requests per minute
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "fallback_default_secret_key_1234567890_change_me_in_production";

const protectedPaths = ["/passwords", "/cards", "/post"];
const authPaths = ["/sign-in", "/sign-up"];
const rateLimitPaths = [
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/send-verification",
  "/api/v1/auth/verify-email",
  "/api/v1/auth/verify-reset-otp",
  "/api/v1/auth/passkey/verify",
  "/api/v1/auth/passkey/setup",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/profile/update",
  "/api/v1/upload",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting Logic
  const isRateLimitedPath = rateLimitPaths.some((path) => pathname === path);
  if (isRateLimitedPath && process.env.UPSTASH_REDIS_REST_URL) {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  // 2. Protected Paths Logic
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
      // console.warn("Invalid token in middleware:", error);
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

  // If request is for root page ("/") and they are NOT logged in, redirect mobile users to /sign-in
  if (pathname === "/" && !isValid) {
    const userAgent = request.headers.get("user-agent") || "";
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    if (isMobile) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
