import { PrismaClient } from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const getPrismaClient = () => {
  if (process.env.NODE_ENV === "production") {
    const connectionString = process.env.DATABASE_URL!;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool as any);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
};

export const db: PrismaClient =
  global.__prisma ?? (global.__prisma = getPrismaClient());

if (process.env.NODE_ENV !== "production") {
  global.__prisma = db;
}
