// File: /app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
// IMPORTANT: adjust the relative path so it points to /lib/auth.ts from here.
// This file is in: /app/api/auth/[...nextauth]/route.ts
// To reach /lib/auth.ts you go up four levels: route.ts → [...nextauth] → auth → api → app → (root)
import { authOptions } from "../../../../lib/auth";

/**
 * Prevent Next.js from statically “collecting” this route at build time.
 * Instead, only run NextAuth(authOptions) when a real HTTP request comes in.
 */
export const dynamic = "force-dynamic";

// Create the NextAuth handler. This alone does not connect to the database yet.
const handler = NextAuth(authOptions);

/**
 * NextAuth catch-all expects both GET and POST exports.
 * When NextJS sees a request to /api/auth/... (signin, callback, session, etc.),
 * it will call whichever of these matches the HTTP method.
 */
export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
