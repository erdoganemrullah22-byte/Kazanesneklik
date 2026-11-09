// Generates the PWA icons from a single SVG design (run: pnpm icons).
// Output is committed: public/icons/*.png, public/apple-touch-icon.png and
// app/icon.svg (favicon). Colours match the design tokens (plan 7.8).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PINE = "#115d4d";
const APRICOT = "#f5ac69";

/**
 * @param {{ radius: number, scale: number }} options
 *   radius: corner radius of the background (0 = full bleed square);
 *   scale: size of the mark relative to the canvas (maskable icons keep the
 *   mark inside the central safe zone).
 */
function svg({ radius, scale }) {
  const offset = (512 - 512 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="${PINE}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="M140 356c0-150 232-150 232 0" fill="none" stroke="${APRICOT}" stroke-width="48" stroke-linecap="round"/>
    <circle cx="256" cy="166" r="38" fill="${APRICOT}"/>
  </g>
</svg>
`;
}

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, radius: 120, scale: 1 },
  { file: "public/icons/icon-512.png", size: 512, radius: 120, scale: 1 },
  // Maskable: full bleed, mark within the 80 % safe circle.
  { file: "public/icons/maskable-192.png", size: 192, radius: 0, scale: 0.72 },
  { file: "public/icons/maskable-512.png", size: 512, radius: 0, scale: 0.72 },
  // iOS applies its own rounded mask; transparent corners would show black.
  { file: "public/apple-touch-icon.png", size: 180, radius: 0, scale: 0.86 },
];

for (const { file, size, radius, scale } of outputs) {
  const target = path.join(root, file);
  await mkdir(path.dirname(target), { recursive: true });
  await sharp(Buffer.from(svg({ radius, scale })), { density: 300 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(target);
  console.log(`✓ ${file} (${size}×${size})`);
}

await writeFile(path.join(root, "app/icon.svg"), svg({ radius: 120, scale: 1 }));
console.log("✓ app/icon.svg");
