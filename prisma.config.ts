import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma Migrate needs a session/direct connection. Supabase calls this
    // DIRECT_URL; DATABASE_UNPOOLED_URL remains as a Railway-compatible
    // fallback while environments are migrated.
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_UNPOOLED_URL ??
      env("DATABASE_URL"),
  },
});
