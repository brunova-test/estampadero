import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Next only swaps "server-only" for its no-op sibling inside the
      // "react-server" webpack condition; outside that (here, Node) the
      // real module throws unconditionally, so tests need this alias too.
      "server-only": path.join(rootDir, "node_modules/server-only/empty.js"),
      "elestampadero/": `${path.join(rootDir, "src")}/`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
