import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

import { type ExerciseLibraryResult, type RawExerciseEntry, validateExerciseLibrary } from "../library";

export const DEFAULT_EXERCISES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/exercises");

/** Reads every `*.yaml` card in `dir` (non-recursive, sorted by name). */
export async function readExerciseEntries(dir: string = DEFAULT_EXERCISES_DIR): Promise<RawExerciseEntry[]> {
  const files = (await readdir(dir)).filter((file) => file.endsWith(".yaml")).sort();
  return Promise.all(
    files.map(async (file) => ({
      fileSlug: file.slice(0, -".yaml".length),
      data: parse(await readFile(path.join(dir, file), "utf8"), { prettyErrors: true }) as unknown,
    })),
  );
}

export async function loadExerciseLibrary(dir: string = DEFAULT_EXERCISES_DIR): Promise<ExerciseLibraryResult> {
  return validateExerciseLibrary(await readExerciseEntries(dir));
}
