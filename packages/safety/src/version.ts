/**
 * Version of the safety specification implemented by this package
 * (plan 9.2–9.5, 10.3).
 *
 * The plan reserves `1.0` for the clinically signed specification. Faz K runs
 * without a clinical board (plan 11.0), so the version stays below 1.0 and
 * carries a pre-release tag until the "herkese açma kapısı" (11.0.4) sign-off.
 * Every program and lock record stores this value (`Program.safetySpec`,
 * `RegionLock.safetySpec`) so later audits know which rules were in force.
 */
export const safetySpecVersion = "0.0.0-k0" as const;

export type SafetySpecVersion = typeof safetySpecVersion;
