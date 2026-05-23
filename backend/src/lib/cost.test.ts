import { describe, it, expect } from "@jest/globals";
import { calculateCost } from "./cost";

describe("calculateCost", () => {
  it("should calculate cost based on DeepSeek pricing", () => {
    // ¥1/百万输入 + ¥2/百万输出
    const cost = calculateCost({ promptTokens: 1_000_000, completionTokens: 1_000_000 });
    expect(cost).toBe(3); // ¥1 + ¥2
  });

  it("should handle zero tokens", () => {
    const cost = calculateCost({ promptTokens: 0, completionTokens: 0 });
    expect(cost).toBe(0);
  });

  it("should handle fractional tokens at typical evaluation usage", () => {
    // Typical: ~1500 prompt + ~300 completion
    const cost = calculateCost({ promptTokens: 1500, completionTokens: 300 });
    // 1500/1M * 1 + 300/1M * 2 = 0.0015 + 0.0006 = 0.0021
    expect(cost).toBeCloseTo(0.0021, 5);
  });

  it("should weight output tokens at 2x input price", () => {
    // Same tokens, output should cost twice input
    const inputOnly = calculateCost({ promptTokens: 1000, completionTokens: 0 });
    const outputOnly = calculateCost({ promptTokens: 0, completionTokens: 1000 });
    expect(outputOnly).toBe(inputOnly * 2);
  });

  describe("Doubao pricing", () => {
    it("should calculate cost based on Doubao pricing", () => {
      // ¥0.8/百万输入 + ¥2/百万输出
      const cost = calculateCost(
        { promptTokens: 1_000_000, completionTokens: 1_000_000 },
        "doubao-seed-2-0-lite-260428"
      );
      expect(cost).toBe(2.8); // ¥0.8 + ¥2
    });

    it("should handle fractional tokens at typical evaluation usage", () => {
      const cost = calculateCost(
        { promptTokens: 1500, completionTokens: 300 },
        "doubao-seed-2-0-lite-260428"
      );
      // 1500/1M * 0.8 + 300/1M * 2 = 0.0012 + 0.0006 = 0.0018
      expect(cost).toBeCloseTo(0.0018, 5);
    });

    it("should fall back to DeepSeek pricing for unknown models", () => {
      const cost = calculateCost(
        { promptTokens: 1_000_000, completionTokens: 1_000_000 },
        "unknown-model"
      );
      expect(cost).toBe(3); // DeepSeek: ¥1 + ¥2
    });
  });
});
