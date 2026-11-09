/**
 * @kazan/engine — deterministic program engine (plan 5.3, 10.3, 10.5).
 *
 * Rules: pure TypeScript, no I/O, no `Date.now()` / `Math.random()` (dates and
 * seeds are parameters), never imports `@kazan/ai`. K0 ships the package
 * skeleton plus two generic building blocks; levels, program generation,
 * adaptation and substitution arrive in K1–K2.
 */
export { engineVersion } from "./version";
export { createSeededRandom, randomInt } from "./random";
export type { RandomSource } from "./random";
export { isoWeek, isoWeekKey } from "./calendar";
export type { IsoWeek } from "./calendar";
