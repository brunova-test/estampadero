import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Railway exposes this direct URL after enabling PgBouncer. Migrations
    // require a dedicated Postgres session; runtime queries still use the
    // pooled DATABASE_URL configured in src/server/db.ts.
    url: process.env.DATABASE_UNPOOLED_URL ?? env("DATABASE_URL"),
  },
});
