import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// In development, always create a new client when the module is first loaded
// (i.e. after a schema change + prisma generate). We store it on globalThis
// so HMR doesn't create hundreds of connections, but we do NOT reuse a stale
// singleton across prisma generate runs because `rm -rf .next` clears the
// module cache completely.
export const db: PrismaClient =
  global.__prisma ?? (global.__prisma = new PrismaClient());

if (process.env.NODE_ENV !== "production") {
  global.__prisma = db;
}
