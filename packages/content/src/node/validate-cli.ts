/**
 * `pnpm content:validate` — validates every content file; exits 1 on any issue.
 * Usage: tsx src/node/validate-cli.ts [exercisesDir]
 */
import { DEFAULT_EXERCISES_DIR, loadExerciseLibrary } from "./load";

const dir = process.argv[2] ?? DEFAULT_EXERCISES_DIR;
const { exercises, issues } = await loadExerciseLibrary(dir);

if (issues.length > 0) {
  console.error(`content:validate — ${issues.length} sorun bulundu (${dir}):`);
  for (const issue of issues) {
    console.error(`  ✗ ${issue.fileSlug} › ${issue.path}: ${issue.message}`);
  }
  process.exit(1);
}

console.log(`content:validate — ${exercises.length} egzersiz kartı geçerli.`);
