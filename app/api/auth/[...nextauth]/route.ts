// File: /app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// ───────────────────────────────────────────────────────────────
// Instruct Next.js: “Do not attempt to statically import / collect
// this route at build time. Only run when a real request comes in.”
// ───────────────────────────────────────────────────────────────
export const dynamic = "force-dynamic";

/**
 * Create your NextAuth handler. This alone does NOT run until an actual
 * GET or POST request is made. By using `export function GET/POST`, we
 * guarantee “lazy” invocation.
 */
const handler = NextAuth(authOptions);

/**
 * Next.js expects separate GET and POST exports for a catch-all next-auth route.
 * When /api/auth/… is called with GET (e.g. a health check), NextAuth handles it.
 * When it’s called with POST (e.g. sign-in, callback), NextAuth handles that too.
 */
export function GET(request: Request) {
  return handler(request);
}

export function POST(request: Request) {
  return handler(request);
}
