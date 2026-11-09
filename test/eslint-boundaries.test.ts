/**
 * Lint fixtures for the package boundaries (plan 10.3): runs the real ESLint
 * config against small snippets placed (virtually) in real files, so the rules
 * that keep the pure packages pure and Prisma inside server/queries cannot
 * silently regress. Nothing is written to disk.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint, type Linter } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BOUNDARY_RULES = new Set(["no-restricted-imports", "no-restricted-syntax", "import/no-relative-packages"]);

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd: repoRoot });
});

/** Boundary findings for `code` linted as if it were the file at `file`. */
async function boundaryFindings(file: string, code: string): Promise<Linter.LintMessage[]> {
  const [result] = await eslint.lintText(code, { filePath: path.join(repoRoot, file) });
  return (result?.messages ?? []).filter((message) => message.ruleId !== null && BOUNDARY_RULES.has(message.ruleId));
}

const ENGINE_FILE = "packages/engine/src/index.ts";
const SAFETY_FILE = "packages/safety/src/index.ts";
const WEB_COMPONENT_FILE = "apps/web/components/logo.tsx";
const WEB_SERVER_ACTION_FILE = "apps/web/server/actions/auth.ts";

describe("package boundaries (ESLint)", { timeout: 120_000 }, () => {
  it("engine: relative path into packages/ai is rejected", async () => {
    const findings = await boundaryFindings(
      ENGINE_FILE,
      'import { getAnthropicClient } from "../../ai/src/index";\nexport const client = getAnthropicClient;\n',
    );
    expect(findings.map((f) => f.ruleId)).toEqual(
      expect.arrayContaining(["import/no-relative-packages", "no-restricted-imports"]),
    );
  });

  it("engine: package-name import of @kazan/ai is rejected", async () => {
    const findings = await boundaryFindings(ENGINE_FILE, 'export { getAnthropicClient } from "@kazan/ai";\n');
    expect(findings.map((f) => f.ruleId)).toContain("no-restricted-imports");
  });

  it("engine and safety: dynamic import() is rejected", async () => {
    for (const file of [ENGINE_FILE, SAFETY_FILE]) {
      const findings = await boundaryFindings(file, 'export const load = () => import("@kazan/ai");\n');
      expect(
        findings.map((f) => f.ruleId),
        file,
      ).toContain("no-restricted-syntax");
    }
  });

  it("safety: reading process is rejected", async () => {
    const [result] = await eslint.lintText('export const key = process.env["X"];\n', {
      filePath: path.join(repoRoot, SAFETY_FILE),
    });
    expect(result?.messages.map((m) => m.ruleId)).toContain("no-restricted-globals");
  });

  it("web component: relative path to the Prisma client is rejected (static and dynamic)", async () => {
    const staticImport = await boundaryFindings(
      WEB_COMPONENT_FILE,
      'import { prisma } from "../server/db";\nexport const db = prisma;\n',
    );
    expect(staticImport.map((f) => f.ruleId)).toContain("no-restricted-imports");

    const dynamicImport = await boundaryFindings(
      WEB_COMPONENT_FILE,
      'export const load = () => import("../server/db");\nexport const ai = () => import("@kazan/ai");\n',
    );
    expect(dynamicImport.filter((f) => f.ruleId === "no-restricted-syntax")).toHaveLength(2);
  });

  it("web: process.env destructuring and aliasing are rejected", async () => {
    const findings = await boundaryFindings(
      WEB_COMPONENT_FILE,
      "const { ANTHROPIC_API_KEY } = process.env;\nconst all = process.env;\nexport const x = [ANTHROPIC_API_KEY, all];\n",
    );
    expect(findings.filter((f) => f.ruleId === "no-restricted-syntax")).toHaveLength(2);
  });

  it("web server outside queries/: relative import of the Prisma client is rejected", async () => {
    const findings = await boundaryFindings(
      WEB_SERVER_ACTION_FILE,
      'import { prisma } from "../db";\nexport const db = prisma;\nexport const load = () => import("../db");\n',
    );
    expect(findings.map((f) => f.ruleId)).toEqual(
      expect.arrayContaining(["no-restricted-imports", "no-restricted-syntax"]),
    );
  });

  it("allowed imports stay clean", async () => {
    expect(await boundaryFindings(ENGINE_FILE, 'export { isoWeek } from "./calendar";\n')).toEqual([]);
    expect(
      await boundaryFindings(
        WEB_COMPONENT_FILE,
        'import { cn } from "@/lib/utils";\nexport const isProd = process.env.NODE_ENV === "production";\nexport { cn };\n',
      ),
    ).toEqual([]);
  });
});
