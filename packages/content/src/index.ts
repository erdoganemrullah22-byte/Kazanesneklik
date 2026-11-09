/**
 * @kazan/content — content schemas and library validation (plan 5.5, 10.7).
 * This entry is pure (browser-safe). File-system loading lives in
 * `@kazan/content/node`.
 */
export * from "./schema/exercise";
export { validateExerciseLibrary } from "./library";
export type { ContentIssue, ExerciseLibraryResult, RawExerciseEntry } from "./library";
