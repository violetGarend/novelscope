import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { guardScores, checkVariance, detectDivergence, type RawScores } from "./index";
import type { DimensionScores } from "../pipeline/types";

describe("ConsistencyGuard", () => {
  describe("score clamping", () => {
    it("should clamp negative scores to 0", () => {
      const raw: RawScores = {
        hookScore: -5,
        climaxScore: -1,
        cliffhangerScore: -10,
        pacingScore: -0.5,
      };
      const result = guardScores(raw);
      expect(result.hookScore).toBe(0);
      expect(result.climaxScore).toBe(0);
      expect(result.cliffhangerScore).toBe(0);
      expect(result.pacingScore).toBe(0);
    });

    it("should clamp scores above 10 to 10", () => {
      const raw: RawScores = {
        hookScore: 15,
        climaxScore: 11,
        cliffhangerScore: 100,
        pacingScore: 10.5,
      };
      const result = guardScores(raw);
      expect(result.hookScore).toBe(10);
      expect(result.climaxScore).toBe(10);
      expect(result.cliffhangerScore).toBe(10);
      expect(result.pacingScore).toBe(10);
    });

    it("should keep valid scores unchanged", () => {
      const raw: RawScores = {
        hookScore: 7,
        climaxScore: 8.5,
        cliffhangerScore: 3,
        pacingScore: 0,
      };
      const result = guardScores(raw);
      expect(result.hookScore).toBe(7);
      expect(result.climaxScore).toBe(8.5);
      expect(result.cliffhangerScore).toBe(3);
      expect(result.pacingScore).toBe(0);
    });

    it("should not return overallScore", () => {
      const raw: RawScores = {
        hookScore: 7,
        climaxScore: 8,
        cliffhangerScore: 6,
        pacingScore: 5,
      };
      const result = guardScores(raw);
      expect(result).not.toHaveProperty("overallScore");
      expect(Object.keys(result).sort()).toEqual([
        "cliffhangerScore",
        "climaxScore",
        "hookScore",
        "pacingScore",
      ]);
    });

    it("should handle boundary scores (0 and 10)", () => {
      const raw: RawScores = {
        hookScore: 0,
        climaxScore: 10,
        cliffhangerScore: 0,
        pacingScore: 10,
      };
      const result = guardScores(raw);
      expect(result.hookScore).toBe(0);
      expect(result.climaxScore).toBe(10);
      expect(result.cliffhangerScore).toBe(0);
      expect(result.pacingScore).toBe(10);
    });
  });

  describe("variance budget", () => {
    it("should pass when variance is below threshold", () => {
      const scores = [6.8, 7.0, 6.9, 7.1, 6.7];
      const result = checkVariance(scores);
      expect(result.isWithinBudget).toBe(true);
      expect(result.variance).toBeLessThan(0.5);
    });

    it("should fail when variance exceeds threshold", () => {
      const scores = [3.0, 8.0, 5.0, 9.0, 2.0];
      const result = checkVariance(scores);
      expect(result.isWithinBudget).toBe(false);
      expect(result.variance).toBeGreaterThanOrEqual(0.5);
    });

    it("should return variance 0 for single score", () => {
      const scores = [7.5];
      const result = checkVariance(scores);
      expect(result.isWithinBudget).toBe(true);
      expect(result.variance).toBe(0);
    });

    it("should return variance 0 for empty array", () => {
      const scores: number[] = [];
      const result = checkVariance(scores);
      expect(result.isWithinBudget).toBe(true);
      expect(result.variance).toBe(0);
    });

    it("should calculate correct variance for identical scores", () => {
      const scores = [5.0, 5.0, 5.0, 5.0];
      const result = checkVariance(scores);
      expect(result.isWithinBudget).toBe(true);
      expect(result.variance).toBe(0);
    });
  });

  describe("detectDivergence", () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("returns empty array when all dimensions identical (zero delta)", () => {
      const a: DimensionScores = { hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
      const b: DimensionScores = { hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
      const result = detectDivergence(a, b);
      expect(result).toEqual([]);
    });

    it("returns empty array when all deltas <= 2", () => {
      const a: DimensionScores = { hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7 };
      const b: DimensionScores = { hookScore: 9, climaxScore: 5, cliffhangerScore: 8, pacingScore: 6 };
      const result = detectDivergence(a, b);
      expect(result).toEqual([]);
    });

    it("detects single dimension divergence (delta > 2)", () => {
      const a: DimensionScores = { hookScore: 9, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
      const b: DimensionScores = { hookScore: 4, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
      const result = detectDivergence(a, b);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ dimension: "hookScore", deepseek: 9, doubao: 4, delta: 5 });
    });

    it("detects multiple dimension divergence", () => {
      const a: DimensionScores = { hookScore: 8, climaxScore: 8, cliffhangerScore: 8, pacingScore: 8 };
      const b: DimensionScores = { hookScore: 3, climaxScore: 4, cliffhangerScore: 5, pacingScore: 2 };
      const result = detectDivergence(a, b);
      expect(result.length).toBe(4);
      expect(result[0].dimension).toBe("hookScore");
      expect(result[0].delta).toBe(5);
    });

    it("does NOT flag delta of exactly 2.0", () => {
      const a: DimensionScores = { hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7 };
      const b: DimensionScores = { hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
      const result = detectDivergence(a, b);
      expect(result).toEqual([]);
    });

    it("flags delta of 2.1 (strictly > 2)", () => {
      const a: DimensionScores = { hookScore: 7.1, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
      const b: DimensionScores = { hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
      const result = detectDivergence(a, b);
      expect(result.length).toBe(1);
      expect(result[0].dimension).toBe("hookScore");
      expect(result[0].delta).toBe(2.1);
    });

    it("logs divergence events via console.warn", () => {
      const a: DimensionScores = { hookScore: 9, climaxScore: 6, cliffhangerScore: 8, pacingScore: 7 };
      const b: DimensionScores = { hookScore: 3, climaxScore: 3, cliffhangerScore: 8, pacingScore: 7 };
      detectDivergence(a, b);
      // hookScore delta=6, climaxScore delta=3 → 2 divergences
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("hookScore"),
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("climaxScore"),
      );
    });

    it("does not log when no divergence", () => {
      const a: DimensionScores = { hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
      const b: DimensionScores = { hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7 };
      detectDivergence(a, b);
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});
