import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^server-only$/, replacement: r("./test/stubs/server-only.ts") },
      { find: /^@\//, replacement: `${r("./apps/web")}/` },
    ],
  },
  test: {
    environment: "node",
    include: ["packages/*/src/**/*.test.ts", "apps/web/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**", "apps/web/tests/e2e/**"],
    restoreMocks: true,
    unstubEnvs: true,
  },
});
