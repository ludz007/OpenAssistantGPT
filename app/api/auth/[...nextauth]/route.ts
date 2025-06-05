// File: /app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// ────────────────────────────────────────────────────────────────────────────────────
// Prevent Next.js from trying to import / collect this route’s code at build time.
// Only run NextAuth(…) when an actual HTTP request arrives.
// ────────────────────────────────────────────────────────────────────────────────────
export const dynamic = "force-dynamic";

// Create the NextAuth handler. Nothing here runs until handler(request) is called.
const handler = NextAuth(authOptions);

/**
 * NextAuth requires both GET and POST exports for its catch-all route.
 * We forward both to the same handler so all NextAuth logic runs at runtime.
 */
export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
