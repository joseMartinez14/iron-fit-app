import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes - only API routes under /api/protected require authentication
const isProtectedRoute = createRouteMatcher(["/api/protected(.*)"]);

// CORS helpers
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://iron-fit-client.netlify.app/",
];

function getAllowedOrigins(): string[] {
  const fromEnv =
    process.env.CORS_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_ALLOWED_ORIGINS;
  if (!fromEnv) return defaultAllowedOrigins;
  return fromEnv
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function buildCorsHeaders(req: Request): Headers {
  const origin = req.headers.get("origin");
  const allowed = getAllowedOrigins();
  const headers = new Headers();

  if (origin && allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    req.headers.get("access-control-request-headers") ||
      "Authorization, Content-Type"
  );
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export default clerkMiddleware(async (auth, req) => {
  const isProtected = isProtectedRoute(req);

  // Handle CORS preflight for all non-protected routes
  if (!isProtected && req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: buildCorsHeaders(req),
    });
  }

  if (isProtected) await auth.protect();

  // For other requests on non-protected routes, attach CORS headers
  const res = NextResponse.next();
  if (!isProtected) {
    const cors = buildCorsHeaders(req);
    cors.forEach((v, k) => res.headers.set(k, v));
  }
  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
