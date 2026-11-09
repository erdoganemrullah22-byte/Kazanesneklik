import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { loadExerciseLibrary, readExerciseEntries } from "./node/load";
import { validateExerciseLibrary } from "./library";
import { exerciseSchema } from "./schema/exercise";

const here = path.dirname(fileURLToPath(import.meta.url));
const invalidDir = path.resolve(here, "../test-fixtures/invalid-exercises");

describe("exercise library (data/exercises)", () => {
  it("contains the two sample cards and they are all valid", async () => {
    const { exercises, issues } = await loadExerciseLibrary();
    expect(issues).toEqual([]);
    expect(exercises.map((e) => e.slug).sort()).toEqual([
      "kneeling-hip-flexor-stretch",
      "standing-hip-flexor-stretch",
    ]);
  });

  it("marks every sample card as clinically unreviewed (Faz K)", async () => {
    const { exercises } = await loadExerciseLibrary();
    for (const exercise of exercises) {
      expect(exercise.review).toBeNull();
    }
  });
});

describe("content:validate catches deliberate errors", () => {
  it("reports schema, slug and reference problems in the broken fixture", async () => {
    const { exercises, issues } = await loadExerciseLibrary(invalidDir);
    expect(exercises).toEqual([]);
    const paths = issues.map((issue) => issue.path);
    expect(paths).toContain("regions.primary"); // typo in region enum
    expect(paths).toContain("levels"); // min > max
    expect(paths).toContain("(kök)"); // unknownField rejected by .strict()
  });

  it("flags slug/file mismatch and dangling references", async () => {
    const [entry] = await readExerciseEntries(path.resolve(here, "../data/exercises"));
    expect(entry).toBeDefined();
    const data = { ...(entry?.data as object), noEquipmentAlt: "does-not-exist" };
    const { issues } = validateExerciseLibrary([{ fileSlug: "wrong-name", data }]);
    expect(issues.map((i) => i.path)).toEqual(expect.arrayContaining(["slug", "noEquipmentAlt"]));
  });

  it("rejects cues longer than 120 characters", () => {
    const result = exerciseSchema.shape.cues.safeParse({ tr: ["a".repeat(121), "kısa"] });
    expect(result.success).toBe(false);
  });
});
