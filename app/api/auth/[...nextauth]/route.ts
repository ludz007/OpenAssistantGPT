// File: /app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
// From this file’s folder (app/api/auth/[...nextauth]/), go up four levels to reach /lib/auth.ts:
//   [...nextauth] → auth → api → app → (root) → lib/auth
import { authOptions } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
