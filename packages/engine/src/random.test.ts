import { describe, expect, it } from "vitest";

import { createSeededRandom, randomInt } from "./random";

describe("createSeededRandom", () => {
  it("reproduces the same sequence for the same seed", () => {
    const a = createSeededRandom(20261109);
    const b = createSeededRandom(20261109);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(2);
    expect(Array.from({ length: 5 }, () => a())).not.toEqual(Array.from({ length: 5 }, () => b()));
  });

  it("stays within [0, 1)", () => {
    const random = createSeededRandom(42);
    for (let i = 0; i < 10_000; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("rejects non-integer seeds", () => {
    expect(() => createSeededRandom(1.5)).toThrow(RangeError);
  });
});

describe("randomInt", () => {
  it("covers the inclusive range and nothing outside it", () => {
    const random = createSeededRandom(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2_000; i += 1) {
      const value = randomInt(random, 1, 6);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      seen.add(value);
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("rejects an empty range", () => {
    expect(() => randomInt(createSeededRandom(1), 3, 2)).toThrow(RangeError);
  });
});
