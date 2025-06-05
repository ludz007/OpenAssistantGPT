// File: /app/api/auth/[...nextauth]/route.ts

import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
// Use a relative path to authOptions (app → api → auth → [...nextauth] → root → lib/auth)
import { authOptions } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Only create the NextAuth handler when an actual GET request arrives:
  const handler = NextAuth(authOptions);
  return handler(request);
}

export async function POST(request: NextRequest) {
  const handler = NextAuth(authOptions);
  return handler(request);
}
