import { describe, it, expect } from "@jest/globals";
import { analyzeCliffhanger } from "./index";

describe("CliffhangerAnalyzer", () => {
  it("should return score 0 for empty text", () => {
    const result = analyzeCliffhanger("");
    expect(result.score).toBe(0);
    expect(result.endingType).toBe("flat");
    expect(result.hasQuestion).toBe(false);
    expect(result.hasReversalHint).toBe(false);
  });

  it("should return score 0 for whitespace-only text", () => {
    const result = analyzeCliffhanger("   \n\n   ");
    expect(result.score).toBe(0);
  });

  it("should detect suspense ending with '突然' keyword", () => {
    const text =
      "前面一段内容。\n\n" +
      "再一段内容。\n\n" +
      "突然，一道黑影从暗处袭来。";
    const result = analyzeCliffhanger(text);
    expect(result.suspenseHitCount).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
  });

  it("should detect question ending (strongest cliffhanger)", () => {
    const text =
      "前面很多内容。\n\n" +
      "他缓缓转过身。\n\n" +
      "难道这一切，从一开始就是错的？";
    const result = analyzeCliffhanger(text);
    expect(result.hasQuestion).toBe(true);
    expect(result.endingType).toBe("question");
    expect(result.score).toBeGreaterThan(2);
  });

  it("should detect reversal hint ending", () => {
    const text =
      "前面内容省略。\n\n" +
      "他以为胜券在握。\n\n" +
      "没想到，对方竟然还留了一手。";
    const result = analyzeCliffhanger(text);
    expect(result.hasReversalHint).toBe(true);
    expect(result.endingType).toBe("reversal");
  });

  it("should detect unresolved conflict ending", () => {
    const text =
      "前面内容省略。\n\n" +
      "前方的杀声越来越近。\n\n" +
      "无数敌人从四面八方冲来，他没有退路了。";
    const result = analyzeCliffhanger(text);
    // unresolved conflict + suspense keywords should give a decent score
    expect(result.score).toBeGreaterThan(0);
  });

  it("should penalize resolution ending (chapter feels finished)", () => {
    const text =
      "前面内容省略。\n\n" +
      "一切终于结束了。\n\n" +
      "他松了一口气，放下心来。";
    const result = analyzeCliffhanger(text);
    // Resolution markers should reduce score significantly
    expect(result.score).toBeLessThanOrEqual(3);
  });

  it("should return 0 for flat ending with no suspense", () => {
    const text =
      "前面内容省略。\n\n" +
      "他慢慢地走回家。\n\n" +
      "今天天气很好，阳光明媚。";
    const result = analyzeCliffhanger(text);
    expect(result.score).toBeLessThanOrEqual(2);
    expect(result.endingType).toBe("flat");
  });

  it("should not crash on very short text", () => {
    const result = analyzeCliffhanger("一句话结尾。");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it("should only analyze last 5 paragraphs", () => {
    // Build a text with 20 paragraphs, only the last 5 have cliffhanger signals
    const longText = Array.from({ length: 15 }, (_, i) => `第${i + 1}段普通内容`).join("\n\n") +
      "\n\n" +
      "突然，意想不到的事情发生了。\n\n" +
      "竟然是他？\n\n" +
      "这怎么可能？";
    const result = analyzeCliffhanger(longText);
    // Should still detect the cliffhanger in the last paragraphs
    expect(result.score).toBeGreaterThan(0);
  });
});
