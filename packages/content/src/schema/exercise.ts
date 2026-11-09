import { z } from "zod";

/**
 * Exercise card schema (plan 5.5). Cards live in
 * `packages/content/data/exercises/<slug>.yaml`, are validated with this
 * schema (`.strict()`: unknown fields are rejected) and change only via PR.
 *
 * K0 note: ConditionCode and PainType vocabularies belong to `@kazan/safety`
 * and arrive in K1/K3. Until then `contraFlags`, `modifications` keys and
 * `stopIf` are checked for *format* only; K1 replaces these with the closed
 * safety enums so that an unknown code breaks the build (fail-closed).
 */

/** Canonical 13-region taxonomy (plan 3.1.1). */
export const REGIONS = [
  "HAMSTRING",
  "HIP_FLEXOR",
  "HIP_EXTERNAL_ROTATION",
  "THORACIC_ROTATION",
  "SHOULDER_FLEXION",
  "ANKLE_DORSIFLEXION",
  "HIP_INTERNAL_ROTATION",
  "ADDUCTOR",
  "SHOULDER_EXTENSION",
  "WRIST_EXTENSION",
  "NECK",
  "SPINE_FLEXION",
  "SPINE_EXTENSION",
] as const;
export const regionSchema = z.enum(REGIONS);
export type Region = z.infer<typeof regionSchema>;

export const exerciseTypeSchema = z.enum(["static", "dynamic", "active", "pnf", "strength_rom", "loaded", "breathing"]);

export const positionSchema = z.enum([
  "standing",
  "seated_floor",
  "seated_chair",
  "supine",
  "prone",
  "side_lying",
  "kneeling",
  "quadruped",
]);

export const spaceSchema = z.enum(["standing_only", "floor_mat", "floor_wide"]);

export const evidenceSchema = z.enum(["strong", "moderate", "weak", "expert"]);

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case (a-z, 0-9, -)");

/** Capability id (plan 4.2), e.g. `soft_knee_surface`, `vertical_support`. */
const capabilitySchema = z.string().regex(/^[a-z]+(?:_[a-z]+)*$/, "capability must be snake_case");

/** ConditionCode with an optional region scope, e.g. `DIZ_PROTEZ`, `YAKIN_CERRAHI:knee`. */
const conditionCodeSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]*(?::[a-z_]+)?$/, "condition code must look like CODE or CODE:scope");

/** PainType id (plan 10.4), e.g. `SHARP`, `NEURAL_TRANSIENT`. */
const painTypeSchema = z.string().regex(/^[A-Z][A-Z_]*$/, "pain type must be UPPER_SNAKE_CASE");

/** Germe hissi (stretch sensation) scale 0–10; never a pain score. */
const feelSchema = z.number().int().min(0).max(10);

const shortText = z.string().trim().min(1);

/** Turkish is required; English is optional until the `en` locale ships. */
export const localizedTextSchema = z.object({ tr: shortText, en: shortText.optional() }).strict();

const localizedListSchema = (opts: { min: number; max: number; maxChars?: number }) => {
  const item = opts.maxChars ? shortText.max(opts.maxChars) : shortText;
  const list = z.array(item).min(opts.min).max(opts.max);
  return z.object({ tr: list, en: list.optional() }).strict();
};

const rangeSchema = (value: z.ZodNumber) =>
  z
    .object({ min: value, max: value })
    .strict()
    .refine((r: { min: number; max: number }) => r.min <= r.max, { message: "min must be ≤ max" });

export const exerciseSchema = z
  .object({
    slug: slugSchema,
    version: z.number().int().min(1),
    name: localizedTextSchema,
    type: exerciseTypeSchema,
    regions: z
      .object({
        primary: regionSchema,
        secondary: z.array(regionSchema).default([]),
      })
      .strict(),
    /** S1–S6 */
    levels: rangeSchema(z.number().int().min(1).max(6)),
    position: positionSchema,
    space: spaceSchema,
    perSide: z.boolean(),
    quietOk: z.boolean(),
    requires: z.array(capabilitySchema).default([]),
    optional: z.array(capabilitySchema).default([]),
    contraFlags: z.array(conditionCodeSchema).default([]),
    modifications: z
      .record(
        conditionCodeSchema,
        z
          .object({
            maxFeel: feelSchema.optional(),
            cue: localizedTextSchema.optional(),
          })
          .strict(),
      )
      .default({}),
    noEquipmentAlt: slugSchema.nullable(),
    /** Doses come from engine params; this is the target stretch sensation. */
    targetFeel: rangeSchema(feelSchema),
    feelWhere: z.array(regionSchema).min(1),
    stopIf: z.array(painTypeSchema).min(1),
    /** 3–5 steps (plan 5.5 content package). */
    steps: localizedListSchema({ min: 3, max: 5 }),
    /** 2–3 cues, ≤120 characters each so they stay readable in the player. */
    cues: localizedListSchema({ min: 2, max: 3, maxChars: 120 }),
    mistakes: localizedListSchema({ min: 1, max: 3 }),
    progressions: z
      .object({
        next: z.array(slugSchema).default([]),
        prev: z.array(slugSchema).default([]),
      })
      .strict(),
    lateral: z.array(slugSchema).default([]),
    media: z
      .object({
        keyframes: z.array(z.string().regex(/^[a-z0-9-]+\.svg$/)).default([]),
        video: z.string().nullable().default(null),
        alt: localizedTextSchema,
      })
      .strict(),
    evidence: evidenceSchema,
    requiresCoachUnlock: z.boolean().default(false),
    /**
     * Clinical review (plan 5.5). `null` = not clinically reviewed. Faz K runs
     * without a clinical board (plan 11.0), so cards stay `null` until the
     * "herkese açma kapısı" (11.0.4).
     */
    review: z
      .object({
        clinician: shortText,
        trainer: shortText,
        at: z.iso.date(),
        safetySpec: shortText,
      })
      .strict()
      .nullable(),
  })
  .strict();

export type Exercise = z.infer<typeof exerciseSchema>;
