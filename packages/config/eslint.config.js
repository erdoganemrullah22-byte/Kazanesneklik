// Shared ESLint flat config for the Kazan Esneklik monorepo.
// Root `eslint.config.mjs` re-exports this. Package boundaries (plan 10.3)
// are enforced here with `no-restricted-imports`, together with the
// dependency lists in each package.json (pnpm does not hoist).
import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const TS_FILES = ["**/*.{ts,tsx,mts,cts}"];
const WEB_FILES = ["apps/web/**/*.{js,jsx,mjs,ts,tsx}"];
const SOURCE_FILES = ["packages/*/**/*.{js,mjs,ts,tsx,mts}", "apps/*/**/*.{js,jsx,mjs,ts,tsx,mts}", "test/**/*.ts"];

// eslint-plugin-import comes with eslint-config-next. Reuse the very same plugin
// object (flat config refuses two different objects under one name) and its
// resolver settings, so `import/no-relative-packages` also runs in packages/*.
const nextBaseConfig = nextCoreWebVitals.find((config) => config.plugins?.import);
if (!nextBaseConfig?.plugins || !nextBaseConfig.settings) {
  throw new Error("eslint-config-next: import plugin not found (needed for package boundaries)");
}
const importPlugin = nextBaseConfig.plugins.import;
const importSettings = {
  "import/parsers": nextBaseConfig.settings["import/parsers"],
  "import/resolver": nextBaseConfig.settings["import/resolver"],
};

/** Nothing in a pure package may do I/O or talk to the server-side layers. */
const NO_IO_PATHS = [
  { name: "@kazan/ai", message: "Saf paketler AI katmanını import edemez (plan 10.3)." },
  { name: "@kazan/db", message: "Saf paketler veritabanına erişemez (plan 10.3)." },
  { name: "@anthropic-ai/sdk", message: "Anthropic SDK yalnızca packages/ai içinde kullanılır." },
  { name: "@prisma/client", message: "Prisma yalnızca packages/db ve apps/web/server/queries içinde." },
  { name: "server-only", message: "Saf paketler istemci ve sunucuda aynı çalışır." },
  { name: "next", message: "Saf paketler çatıdan bağımsızdır." },
  { name: "react", message: "Saf paketler arayüzden bağımsızdır." },
];
const NO_IO_PATTERNS = [
  { group: ["node:*"], message: "Saf paketlerde Node API'si (I/O) yok." },
  {
    group: ["fs", "fs/*", "path", "child_process", "http", "https", "net", "os"],
    message: "Saf paketlerde I/O yok.",
  },
  { group: ["@kazan/ai/*", "@kazan/db/*", "next/*", "@prisma/*"], message: "Saf paketlerde I/O yok." },
  // Relative escapes into the server-side packages (`../../ai/src/...`).
  // `import/no-relative-packages` below catches any cross-package relative path.
  {
    regex: "(^|/)(ai|db)/(src|prisma)(/|$)",
    message: "Saf paketler AI ve veritabanı katmanına göreli yolla da erişemez (plan 10.3).",
  },
];

/** `import()` is not covered by no-restricted-imports. */
const NO_DYNAMIC_IMPORT = {
  selector: "ImportExpression",
  message: "Saf paketlerde dinamik import yok (plan 10.3).",
};

/** Reading the environment in app code bypasses lib/env.ts validation. */
const ENV_ACCESS_SELECTORS = [
  {
    selector:
      "MemberExpression[object.type='MemberExpression'][object.object.name='process'][object.property.name='env'][property.name!='NODE_ENV']",
    message: "Ortam değişkenlerini yalnızca lib/env.ts üzerinden oku (doğrulanmış, sunucuya özel).",
  },
  {
    // const { ANTHROPIC_API_KEY } = process.env  /  const e = process.env
    selector: "VariableDeclarator[init.type='MemberExpression'][init.object.name='process'][init.property.name='env']",
    message: "process.env'i parçalama ya da takma adla okuma; lib/env.ts üzerinden oku.",
  },
  {
    // ({ X } = process.env)
    selector:
      "AssignmentExpression[right.type='MemberExpression'][right.object.name='process'][right.property.name='env']",
    message: "process.env'i parçalama ya da takma adla okuma; lib/env.ts üzerinden oku.",
  },
];

/** Dynamic imports of the server-only layers from web code outside server/. */
const WEB_DYNAMIC_IMPORT = {
  selector:
    "ImportExpression[source.value=/^(@kazan\\/(ai|db)|@anthropic-ai\\/sdk|@prisma\\/)|(^|\\/)server\\/db(\\.ts)?$/]",
  message: "Veritabanı ve AI katmanı yalnızca apps/web/server üzerinden (dinamik import dahil).",
};

/** Dynamic imports of Prisma in server/ outside queries/ (and db.ts, auth.ts). */
const SERVER_DYNAMIC_DB_IMPORT = {
  selector: "ImportExpression[source.value=/^(@kazan\\/db|@prisma\\/)|(^|\\/)db(\\.ts)?$/]",
  message: "Doğrudan Prisma erişimi yalnızca server/queries içinde (dinamik import dahil, plan 10.3).",
};

/** Determinism for the engine and safety core (plan 10.3). */
const DETERMINISM_RULES = {
  "no-restricted-properties": [
    "error",
    { object: "Date", property: "now", message: "Tarih parametre olarak gelir (plan 10.3)." },
    { object: "Math", property: "random", message: "Tohumlu üreteç kullan: createSeededRandom (plan 10.3)." },
  ],
  "no-restricted-syntax": [
    "error",
    {
      selector: "NewExpression[callee.name='Date'][arguments.length=0]",
      message: "new Date() saati okur; tarih parametre olarak gelir (plan 10.3).",
    },
    NO_DYNAMIC_IMPORT,
  ],
  "no-restricted-globals": [
    "error",
    { name: "fetch", message: "Saf paketlerde ağ erişimi yok." },
    { name: "localStorage", message: "Saf paketlerde depolama yok." },
    { name: "indexedDB", message: "Saf paketlerde depolama yok." },
    { name: "process", message: "Saf paketler ortamı ve süreci okumaz; değerler parametre olarak gelir." },
  ],
};

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/coverage/**",
    "**/playwright-report/**",
    "**/test-results/**",
    "**/dist/**",
    ".local/**",
    "docs/**",
    "packages/db/src/generated/**",
    "apps/web/public/sw.js",
    "apps/web/public/sw.js.map",
    "apps/web/next-env.d.ts",
  ]),

  js.configs.recommended,
  { languageOptions: { globals: { ...globals.node } } },

  // Next.js rules (react, hooks, a11y, core web vitals) for the web app only.
  ...nextCoreWebVitals.map((config) => ({ ...config, files: WEB_FILES })),
  { files: WEB_FILES, settings: { next: { rootDir: "apps/web" } } },

  // TypeScript (type-aware).
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({ ...config, files: TS_FILES })),
  {
    files: TS_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: repoRoot,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
      "@typescript-eslint/only-throw-error": "error",
      // Async callbacks without await are common in framework hooks; noise.
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    // Tests may poke at loosely typed fixtures.
    files: ["**/*.test.ts", "apps/web/tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },

  // ── Package boundaries (plan 10.3) ──────────────────────────────────────────
  {
    files: ["packages/safety/src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...NO_IO_PATHS,
            { name: "@kazan/engine", message: "Güvenlik çekirdeği motora bağımlı olamaz." },
            { name: "@kazan/content", message: "Güvenlik çekirdeği içerik paketine bağımlı olamaz." },
          ],
          patterns: NO_IO_PATTERNS,
        },
      ],
      ...DETERMINISM_RULES,
    },
  },
  {
    files: ["packages/engine/src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: NO_IO_PATHS, patterns: NO_IO_PATTERNS }],
      ...DETERMINISM_RULES,
    },
  },
  {
    files: ["packages/contracts/src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: NO_IO_PATHS, patterns: NO_IO_PATTERNS }],
      "no-restricted-syntax": ["error", NO_DYNAMIC_IMPORT],
    },
  },
  {
    // The content schema is shared with the browser; file loading lives in src/node.
    files: ["packages/content/src/**/*.ts"],
    ignores: ["**/*.test.ts", "packages/content/src/node/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: NO_IO_PATHS, patterns: NO_IO_PATTERNS }],
      "no-restricted-syntax": ["error", NO_DYNAMIC_IMPORT],
    },
  },
  {
    files: ["packages/ai/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@kazan/db", message: "AI katmanı veritabanına doğrudan erişmez; kalıcılık apps/web/server'da." },
            { name: "next", message: "AI katmanı çatıdan bağımsızdır." },
            { name: "react", message: "AI katmanı yalnızca sunucuda çalışır." },
          ],
          patterns: [{ group: ["next/*", "@prisma/*"], message: "AI katmanı çatıdan ve ORM'den bağımsızdır." }],
        },
      ],
    },
  },

  // Any relative import that lands in another workspace package (resolved, so
  // `../../ai/src/index`, `../../../packages/db/src` etc.): use the package name,
  // which the boundary rules above and the package.json dependency lists check.
  {
    files: SOURCE_FILES,
    plugins: { import: importPlugin },
    settings: importSettings,
    rules: { "import/no-relative-packages": "error" },
  },

  // Web app: database and AI only from the server layer. Each file group below
  // sets the complete `no-restricted-syntax` list for its files (a later config
  // object replaces the rule's options, it does not merge them).
  {
    files: WEB_FILES,
    ignores: ["apps/web/server/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@kazan/db", message: "Veritabanı erişimi yalnızca apps/web/server/queries içinde (plan 10.3)." },
            { name: "@kazan/ai", message: "AI yalnızca apps/web/server üzerinden çağrılır." },
            { name: "@anthropic-ai/sdk", message: "AI yalnızca packages/ai üzerinden çağrılır." },
            { name: "@/server/db", message: "Prisma istemcisi yalnızca server/queries içinde kullanılır." },
          ],
          patterns: [
            { group: ["@prisma/*"], message: "Prisma yalnızca packages/db ve server/queries içinde." },
            {
              // Relative paths to the Prisma client (`../server/db`, `../../server/db.ts`).
              regex: "(^|/)server/db(\\.ts)?$",
              message: "Prisma istemcisi yalnızca server/queries içinde kullanılır (göreli yol dahil).",
            },
          ],
        },
      ],
      "no-restricted-syntax": ["error", WEB_DYNAMIC_IMPORT],
    },
  },
  {
    files: ["apps/web/server/**/*.ts"],
    ignores: ["apps/web/server/db.ts", "apps/web/server/auth.ts", "apps/web/server/queries/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@kazan/db", message: "Doğrudan Prisma erişimi yalnızca server/queries içinde (plan 10.3)." },
          ],
          patterns: [
            {
              group: ["./db", "../db", "@/server/db", "@prisma/*"],
              message: "Doğrudan Prisma erişimi yalnızca server/queries içinde (plan 10.3).",
            },
            {
              regex: "(^|/)server/db(\\.ts)?$|^(\\.\\.?/)+db(\\.ts)?$",
              message: "Doğrudan Prisma erişimi yalnızca server/queries içinde (plan 10.3).",
            },
          ],
        },
      ],
    },
  },
  // Environment variables are read and validated only in lib/env*.ts.
  {
    files: ["apps/web/{app,components,lib}/**/*.{ts,tsx}", "apps/web/proxy.ts"],
    ignores: ["apps/web/lib/env.ts", "apps/web/lib/env-schema.ts", "**/*.test.ts"],
    rules: { "no-restricted-syntax": ["error", ...ENV_ACCESS_SELECTORS, WEB_DYNAMIC_IMPORT] },
  },
  {
    files: ["apps/web/server/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: { "no-restricted-syntax": ["error", ...ENV_ACCESS_SELECTORS, SERVER_DYNAMIC_DB_IMPORT] },
  },
  {
    // The Prisma client itself, the Better Auth adapter and the query modules.
    files: ["apps/web/server/db.ts", "apps/web/server/auth.ts", "apps/web/server/queries/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: { "no-restricted-syntax": ["error", ...ENV_ACCESS_SELECTORS] },
  },
]);
