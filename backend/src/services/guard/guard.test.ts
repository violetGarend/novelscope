import { describe, it, expect } from "@jest/globals";
import { guardScores, checkVariance, type RawScores, type ValidatedScores } from "./index";

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

    it("should round overall score to 1 decimal place", () => {
      const raw: RawScores = {
        hookScore: 7,
        climaxScore: 8,
        cliffhangerScore: 6,
        pacingScore: 5,
      };
      const result = guardScores(raw);
      // 7*0.3 + 8*0.3 + 6*0.25 + 5*0.15 = 2.1 + 2.4 + 1.5 + 0.75 = 6.75 → 6.8
      expect(result.overallScore).toBe(6.8);
      expect(Number.isInteger(result.overallScore * 10)).toBe(true);
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
});
