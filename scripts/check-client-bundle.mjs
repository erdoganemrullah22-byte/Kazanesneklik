#!/usr/bin/env node
// Secret scan of everything the browser can download (plan 10.11, 10.14):
//   - apps/web/.next/static/** (client bundles),
//   - the generated service worker (apps/web/public/sw.js),
//   - prerendered output served as-is: .next/server/{app,pages,route-cache}
//     files ending in .html, .rsc or .body (a server component that embedded a
//     secret at build time would end up there).
// Fails the build if an Anthropic key pattern or the server-only variable name
// shows up, or if the *value* of a server secret present in this environment
// leaks into it. (The name BETTER_AUTH_SECRET legitimately appears in Better
// Auth's client library as a lookup key, so for that one only the value is
// checked.)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, "apps/web/.next");
/** [path, file filter] — directories are walked recursively. */
const PRERENDERED = /\.(html|rsc|body)$/;
const targets = [
  [path.join(nextDir, "static"), () => true],
  [path.join(root, "apps/web/public/sw.js"), () => true],
  [path.join(nextDir, "server/app"), (file) => PRERENDERED.test(file)],
  [path.join(nextDir, "server/pages"), (file) => PRERENDERED.test(file)],
  [path.join(nextDir, "server/route-cache"), (file) => PRERENDERED.test(file)],
];
const patterns = [
  { label: "sk-ant", test: (content) => content.includes("sk-ant") },
  { label: "ANTHROPIC_API_KEY", test: (content) => content.includes("ANTHROPIC_API_KEY") },
];
for (const name of ["ANTHROPIC_API_KEY", "BETTER_AUTH_SECRET", "DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
  const value = process.env[name];
  if (value && value.length >= 8) {
    patterns.push({ label: `${name} değeri`, test: (content) => content.includes(value) });
  }
}

function* files(target) {
  const stat = statSync(target);
  if (stat.isFile()) {
    yield target;
    return;
  }
  for (const entry of readdirSync(target)) yield* files(path.join(target, entry));
}

if (!existsSync(path.join(nextDir, "static"))) {
  console.error("İstemci paketi bulunamadı: önce `pnpm build` çalıştır (apps/web/.next/static).");
  process.exit(2);
}

let scanned = 0;
let prerendered = 0;
const hits = [];
for (const [target, include] of targets.filter(([t]) => existsSync(t))) {
  for (const file of files(target)) {
    if (!include(file)) continue;
    scanned += 1;
    if (PRERENDERED.test(file) && !file.startsWith(path.join(nextDir, "static"))) prerendered += 1;
    const content = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      // Report only the label and file, never the matched value itself.
      if (pattern.test(content)) hits.push(`${path.relative(root, file)}: ${pattern.label}`);
    }
  }
}

if (hits.length > 0) {
  console.error(`Sır taraması BAŞARISIZ — istemci paketinde yasak kalıp bulundu:\n  ${hits.join("\n  ")}`);
  process.exit(1);
}
console.log(
  `Sır taraması geçti: ${scanned} dosya tarandı (${prerendered} önceden render edilmiş çıktı dahil; ` +
    `${patterns.map((p) => p.label).join(", ")}).`,
);
