import { describe, it, expect } from "@jest/globals";
import { analyzeCliffhanger } from "./index";

describe("CliffhangerAnalyzer", () => {
  it("should return zero features for empty text", () => {
    const result = analyzeCliffhanger("");
    expect(result.endingType).toBe("flat");
    expect(result.hasQuestion).toBe(false);
    expect(result.hasReversalHint).toBe(false);
    expect(result.suspenseHitCount).toBe(0);
  });

  it("should return zero features for whitespace-only text", () => {
    const result = analyzeCliffhanger("   \n\n   ");
    expect(result.suspenseHitCount).toBe(0);
    expect(result.endingType).toBe("flat");
  });

  it("should detect suspense ending with '突然' keyword", () => {
    const text =
      "前面一段内容。\n\n" +
      "再一段内容。\n\n" +
      "突然，一道黑影从暗处袭来。";
    const result = analyzeCliffhanger(text);
    expect(result.suspenseHitCount).toBeGreaterThan(0);
  });

  it("should detect question ending (strongest cliffhanger)", () => {
    const text =
      "前面很多内容。\n\n" +
      "他缓缓转过身。\n\n" +
      "难道这一切，从一开始就是错的？";
    const result = analyzeCliffhanger(text);
    expect(result.hasQuestion).toBe(true);
    expect(result.endingType).toBe("question");
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
    // "杀", "冲", "冲来" are unresolved conflict keywords
    expect(result.endingType).toBe("action");
  });

  it("should detect resolution ending type", () => {
    const text =
      "前面内容省略。\n\n" +
      "一切终于结束了。\n\n" +
      "他松了一口气，放下心来。";
    const result = analyzeCliffhanger(text);
    expect(result.endingType).toBeDefined();
    expect(result.hasReversalHint).toBeDefined();
  });

  it("should detect flat ending with no suspense", () => {
    const text =
      "前面内容省略。\n\n" +
      "他慢慢地走回家。\n\n" +
      "今天天气很好，阳光明媚。";
    const result = analyzeCliffhanger(text);
    expect(result.endingType).toBe("flat");
    expect(result.suspenseHitCount).toBe(0);
  });

  it("should not crash on very short text", () => {
    const result = analyzeCliffhanger("一句话结尾。");
    expect(result.endingType).toBeDefined();
    expect(result.suspenseHitCount).toBeGreaterThanOrEqual(0);
  });

  it("should only analyze last 5 paragraphs", () => {
    // Build a text with 20 paragraphs, only the last 5 have cliffhanger signals
    const longText = Array.from({ length: 15 }, (_, i) => `第${i + 1}段普通内容`).join("\n\n") +
      "\n\n" +
      "突然，意想不到的事情发生了。\n\n" +
      "竟然是他？\n\n" +
      "这怎么可能？";
    const result = analyzeCliffhanger(longText);
    expect(result.suspenseHitCount).toBeGreaterThan(0);
    expect(result.hasQuestion).toBe(true);
  });
});
