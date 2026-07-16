import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Use WebSocket for local dev (neon requires ws in Node.js env)
neonConfig.webSocketConstructor = ws;

const getPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter });
};

export const db: PrismaClient =
  global.__prisma ?? (global.__prisma = getPrismaClient());

if (process.env.NODE_ENV !== "production") {
  global.__prisma = db;
}
