import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {



      "server-only": path.join(rootDir, "node_modules/server-only/empty.js"),
      "elestampadero/": `${path.join(rootDir, "src")}/`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
