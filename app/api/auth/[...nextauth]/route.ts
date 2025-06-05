// app/api/auth/[...nextauth]/route.js

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// By exporting this, Next.js will not attempt to statically import
// or “collect” this route at build time. It will only invoke
// NextAuth(authOptions) when an actual GET or POST request arrives.
export const dynamic = "force-dynamic";

// Create a single NextAuth handler instance. This function
// itself does not call database or session‐fetch until a request hits.
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests (required by NextAuth)
export { handler as GET, handler as POST };
