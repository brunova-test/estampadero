import { env } from "elestampadero/env";
import { PrismaClient } from "../../generated/prisma";

function getApplicationDatabaseUrl() {
  const databaseUrl = new URL(env.DATABASE_URL);
  const railwayUnpooledUrl = process.env.DATABASE_UNPOOLED_URL;
  const usesSupavisorTransactionMode = databaseUrl.port === "6543";
  const usesRailwayTransactionPooler =
    railwayUnpooledUrl && railwayUnpooledUrl !== env.DATABASE_URL;



  if (
    (usesSupavisorTransactionMode || usesRailwayTransactionPooler) &&
    !databaseUrl.searchParams.has("pgbouncer")
  ) {
    databaseUrl.searchParams.set("pgbouncer", "true");
  }
  if (!databaseUrl.searchParams.has("connection_limit")) {
    databaseUrl.searchParams.set(
      "connection_limit",
      String(env.PRISMA_CONNECTION_LIMIT),
    );
  }
  if (!databaseUrl.searchParams.has("pool_timeout")) {
    databaseUrl.searchParams.set(
      "pool_timeout",
      String(env.PRISMA_POOL_TIMEOUT_SECONDS),
    );
  }
  return databaseUrl.toString();
}

const createPrismaClient = () =>
  new PrismaClient({
    datasourceUrl: getApplicationDatabaseUrl(),
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
