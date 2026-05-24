import { describe, it, expect } from "@jest/globals";
import { detectFiller } from "./index";

describe("FillerDetector", () => {
  it("should return empty items for empty text", () => {
    const result = detectFiller("");
    expect(result.items).toEqual([]);
  });

  it("should detect highly similar paragraphs", () => {
    const text = [
      "他走在路上，看着远方的山峦，心中感慨万千。",
      "他走在路上，望着远方的山峦，心中感慨万千。",
      "今天的天气非常好，阳光明媚，鸟语花香。",
    ].join("\n\n");
    const result = detectFiller(text);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty("reason");
    expect(result.items[0]).toHaveProperty("suggestion");
  });

  it("should not flag diverse paragraphs", () => {
    const text = [
      "战斗开始了，刀光剑影，血花四溅。",
      "远方传来悠扬的笛声，牧童骑在牛背上。",
      "宫殿里灯火辉煌，皇帝正在设宴款待群臣。",
    ].join("\n\n");
    const result = detectFiller(text);
    expect(result.items.length).toBe(0);
  });

  it("should expose suspiciousPairs with similarity scores", () => {
    const text = [
      "他走在路上，看着远方的山峦，心中感慨万千。",
      "他走在路上，望着远方的山峦，心中感慨万千。",
      "今天的天气非常好，阳光明媚，鸟语花香。",
    ].join("\n\n");
    const result = detectFiller(text);
    expect(result.suspiciousPairs).toBeDefined();
    expect(result.suspiciousPairs.length).toBeGreaterThan(0);
    expect(result.suspiciousPairs[0]).toHaveProperty("paragraphA");
    expect(result.suspiciousPairs[0]).toHaveProperty("paragraphB");
    expect(result.suspiciousPairs[0]).toHaveProperty("similarity");
    expect(result.suspiciousPairs[0].similarity).toBeGreaterThanOrEqual(0);
    expect(result.suspiciousPairs[0].similarity).toBeLessThanOrEqual(1);
  });

  it("should return empty suspiciousPairs for diverse text", () => {
    const text = [
      "战斗开始了，刀光剑影，血花四溅。",
      "远方传来悠扬的笛声，牧童骑在牛背上。",
      "宫殿里灯火辉煌，皇帝正在设宴款待群臣。",
    ].join("\n\n");
    const result = detectFiller(text);
    expect(result.suspiciousPairs).toEqual([]);
  });

  it("should return empty suspiciousPairs for empty text", () => {
    const result = detectFiller("");
    expect(result.suspiciousPairs).toEqual([]);
  });

  it("should mark truncated=false when paragraphs <= 200", () => {
    const text = Array.from({ length: 5 }, (_, i) => `段落${i + 1}的独有内容。`).join("\n\n");
    const result = detectFiller(text);
    expect(result.truncated).toBe(false);
  });

  it("should mark truncated=true when paragraphs > 200", () => {
    const text = Array.from({ length: 250 }, (_, i) => `段落${i + 1}的独有内容。`).join("\n\n");
    const result = detectFiller(text);
    expect(result.truncated).toBe(true);
  });

  it("should process only first 200 paragraphs when truncated", () => {
    // Create 250 paragraphs where the duplicate pair is at positions 205 and 210 (beyond cap)
    const paragraphs: string[] = [];
    for (let i = 0; i < 250; i++) {
      paragraphs.push(`独有段落内容编号${i}，与其他段落完全不同。`);
    }
    // Put near-duplicates at positions 3 and 5 (within first 200) — should be detected
    paragraphs[3] = "这段内容几乎是重复的，与第五段非常相似。";
    paragraphs[5] = "这段内容几乎是重复的，与第三段非常相似。";
    const text = paragraphs.join("\n\n");
    const result = detectFiller(text);
    expect(result.truncated).toBe(true);
    // The duplicate at index 3 should still be found (within cap)
    const hasPair3_5 = result.suspiciousPairs.some(
      (p) => (p.paragraphA === 4 && p.paragraphB === 6) || (p.paragraphA === 6 && p.paragraphB === 4)
    );
    expect(hasPair3_5).toBe(true);
  });

  it("should complete 500 paragraphs within reasonable time", () => {
    const text = Array.from({ length: 500 }, (_, i) => `段落${i + 1}的独有内容，各不相同。`).join("\n\n");
    const start = Date.now();
    const result = detectFiller(text);
    const elapsed = Date.now() - start;
    expect(result.truncated).toBe(true);
    // Should complete well under 2 seconds (O(200²) ≈ 40k comparisons, not O(500²) ≈ 250k)
    expect(elapsed).toBeLessThan(2000);
  });
});
