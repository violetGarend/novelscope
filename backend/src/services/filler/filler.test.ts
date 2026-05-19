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
});
