/**
 * @kazan/safety — safety core (plan 9.3–9.10, 10.3).
 *
 * Rules for this package: pure TypeScript, no I/O, no clock or randomness;
 * the same build runs in the browser and on the server.
 *
 * K0 ships only the package skeleton and the spec version. The ConditionCode
 * dictionary, pain policy (`decidePain`), red-flag list, L0 Turkish matcher
 * and personal caps arrive in later stages (K1/K3) together with their test
 * vectors. Nothing here makes a safety decision yet.
 */
export { safetySpecVersion } from "./version";
export type { SafetySpecVersion } from "./version";
