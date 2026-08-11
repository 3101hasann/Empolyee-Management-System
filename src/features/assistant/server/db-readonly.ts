import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Connection for model-written SQL. Points at a MySQL user that has SELECT on
 * the v_* views only (scripts/assistant-readonly.sql) — even a query that
 * slips past the app-side guard cannot write or read outside the views.
 */
const globalForRo = globalThis as unknown as { prismaReadonly?: PrismaClient };

export function getReadonlyDb(): PrismaClient {
  if (globalForRo.prismaReadonly) return globalForRo.prismaReadonly;
  const url = process.env.DATABASE_URL_READONLY;
  if (!url) {
    throw new Error(
      "DATABASE_URL_READONLY is not set. Run scripts/assistant-readonly.sql against MySQL, then add the connection string to .env (see .env.example).",
    );
  }
  const client = new PrismaClient({ adapter: new PrismaMariaDb(url) });
  if (process.env.NODE_ENV !== "production") {
    globalForRo.prismaReadonly = client;
  }
  return client;
}
