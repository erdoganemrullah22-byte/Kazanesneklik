import type { z } from "zod";

import { type Exercise, exerciseSchema } from "./schema/exercise";

/** One raw card as read from disk (or any other source). */
export interface RawExerciseEntry {
  /** File name without extension; must equal the card's slug. */
  fileSlug: string;
  data: unknown;
}

export interface ContentIssue {
  fileSlug: string;
  path: string;
  message: string;
}

export interface ExerciseLibraryResult {
  exercises: Exercise[];
  issues: ContentIssue[];
}

function formatPath(path: z.core.$ZodIssue["path"]): string {
  return path.length === 0 ? "(kök)" : path.map(String).join(".");
}

/**
 * Validates every card against the schema, then checks library-level rules:
 * slug equals file name, slugs are unique, and every referenced slug
 * (`noEquipmentAlt`, `progressions`, `lateral`) exists and is not the card itself.
 */
export function validateExerciseLibrary(entries: readonly RawExerciseEntry[]): ExerciseLibraryResult {
  const issues: ContentIssue[] = [];
  const exercises: Exercise[] = [];

  for (const entry of entries) {
    const parsed = exerciseSchema.safeParse(entry.data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({ fileSlug: entry.fileSlug, path: formatPath(issue.path), message: issue.message });
      }
      continue;
    }
    if (parsed.data.slug !== entry.fileSlug) {
      issues.push({
        fileSlug: entry.fileSlug,
        path: "slug",
        message: `slug "${parsed.data.slug}" must match the file name "${entry.fileSlug}"`,
      });
    }
    exercises.push(parsed.data);
  }

  const counts = new Map<string, number>();
  for (const exercise of exercises) {
    counts.set(exercise.slug, (counts.get(exercise.slug) ?? 0) + 1);
  }
  for (const [slug, count] of counts) {
    if (count > 1) issues.push({ fileSlug: slug, path: "slug", message: `duplicate slug (${count}×)` });
  }

  const known = new Set(counts.keys());
  for (const exercise of exercises) {
    const refs: Array<[string, string]> = [
      ...(exercise.noEquipmentAlt ? [["noEquipmentAlt", exercise.noEquipmentAlt] as [string, string]] : []),
      ...exercise.progressions.next.map((s, i): [string, string] => [`progressions.next.${i}`, s]),
      ...exercise.progressions.prev.map((s, i): [string, string] => [`progressions.prev.${i}`, s]),
      ...exercise.lateral.map((s, i): [string, string] => [`lateral.${i}`, s]),
    ];
    for (const [path, slug] of refs) {
      if (slug === exercise.slug) {
        issues.push({ fileSlug: exercise.slug, path, message: "a card cannot reference itself" });
      } else if (!known.has(slug)) {
        issues.push({ fileSlug: exercise.slug, path, message: `unknown exercise "${slug}"` });
      }
    }
  }

  return { exercises, issues };
}
