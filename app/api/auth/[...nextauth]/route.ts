// File: /app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
// Replace "@/lib/auth" with the correct relative path from this file to lib/auth.ts
import { authOptions } from "../../../../lib/auth";

// ────────────────────────────────────────────────────────────────────────────────────
// Prevent Next.js from statically collecting this route at build time.
// Only execute NextAuth(...) when a real request arrives.
// ────────────────────────────────────────────────────────────────────────────────────
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
