import { describe, it, expect } from "@jest/globals";
import { analyzeClimax, KEYWORD_DICT } from "./index";

describe("ClimaxAnalyzer", () => {
  it("should return score 0 for empty text", () => {
    const result = analyzeClimax("");
    expect(result.score).toBe(0);
    expect(result.matchedKeywords).toEqual([]);
  });

  it("should have keyword dictionary with 5 categories", () => {
    const categories = Object.keys(KEYWORD_DICT);
    expect(categories).toHaveLength(5);
    expect(categories).toContain("reversal");
    expect(categories).toContain("shock");
    expect(categories).toContain("breakthrough");
    expect(categories).toContain("conflict");
    expect(categories).toContain("emotion");
    for (const cat of categories) {
      expect(KEYWORD_DICT[cat].length).toBeGreaterThanOrEqual(10);
    }
  });

  it("should score > 0 for text with climax keywords", () => {
    const text =
      "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。" +
      "这一战，他彻底翻身逆袭，从此踏上巅峰之路。热血沸腾的战斗，让所有人都震撼不已。";
    const result = analyzeClimax(text);
    expect(result.score).toBeGreaterThan(0);
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
  });

  it("should detect high dialogue density for pure dialogue text", () => {
    const text =
      "「你来了。」\n「我来了。」\n「你终于来了。」\n「是的，我来了。」\n" +
      "「你还好吗？」\n「我很好。」\n「那就好。」\n「嗯。」";
    const result = analyzeClimax(text);
    expect(result.dialogueDensity).toBeGreaterThan(0.5);
  });

  it("should not crash on very short text", () => {
    const result = analyzeClimax("一句话。");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it("should expose keywordCategories grouped by category", () => {
    const text =
      "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。" +
      "这一战，他彻底翻身逆袭，从此踏上巅峰之路。热血沸腾的战斗，让所有人都震撼不已。";
    const result = analyzeClimax(text);
    expect(result.keywordCategories).toBeDefined();
    expect(result.keywordCategories).toHaveProperty("reversal");
    expect(result.keywordCategories).toHaveProperty("shock");
    expect(result.keywordCategories).toHaveProperty("breakthrough");
    expect(result.keywordCategories).toHaveProperty("conflict");
    expect(result.keywordCategories).toHaveProperty("emotion");
    // "碾压" and "逆袭" are in reversal
    expect(result.keywordCategories.reversal).toContain("碾压");
    expect(result.keywordCategories.reversal).toContain("逆袭");
    // "目瞪口呆" and "震撼" are in shock
    expect(result.keywordCategories.shock).toContain("目瞪口呆");
    expect(result.keywordCategories.shock).toContain("震撼");
  });

  it("should return empty arrays for categories with no matches", () => {
    const text = "他走在路上，心情很好。今天天气不错。阳光明媚。微风习习。";
    const result = analyzeClimax(text);
    expect(result.keywordCategories.reversal).toEqual([]);
    expect(result.keywordCategories.shock).toEqual([]);
    expect(result.keywordCategories.breakthrough).toEqual([]);
    expect(result.keywordCategories.conflict).toEqual([]);
    expect(result.keywordCategories.emotion).toEqual([]);
  });
});
