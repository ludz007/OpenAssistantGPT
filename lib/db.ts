// File: /lib/db.ts

import { PrismaClient } from "@prisma/client";

declare global {
  // For __DEV__‐mode hot reloading, we attach PrismaClient
  // to the global object so we don't create multiple instances.
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable so we don't create
  // a new PrismaClient on every file change (hot reload).
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient();
  }
  prisma = global.cachedPrisma;
}

// Export the client as `db`
export const db = prisma;
