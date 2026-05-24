import { describe, it, expect } from "@jest/globals";
import { analyzeHook } from "./index";

describe("HookAnalyzer", () => {
  it("should return zero features for empty text", () => {
    const result = analyzeHook("");
    expect(result.openingType).toBe("description");
    expect(result.hasQuestion).toBe(false);
    expect(result.hasGoldenLine).toBe(false);
    expect(result.conflictHitCount).toBe(0);
    expect(result.suspenseHitCount).toBe(0);
  });

  it("should return zero features for whitespace-only text", () => {
    const result = analyzeHook("   \n\n   ");
    expect(result.conflictHitCount).toBe(0);
    expect(result.suspenseHitCount).toBe(0);
  });

  it("should detect conflict opening", () => {
    const text =
      "一剑斩出，血光冲天。\n\n" +
      "他怒吼一声，全力出击，与敌人厮杀在一起。\n\n" +
      "周围的追兵越来越多，他拼命突围。";
    const result = analyzeHook(text);
    expect(result.conflictHitCount).toBeGreaterThan(0);
    expect(["conflict", "mixed"]).toContain(result.openingType);
  });

  it("should detect suspense opening", () => {
    const text =
      "他发现了一个惊人的秘密。这个真相竟然隐藏了十年之久。\n\n" +
      "事情变得异常诡异，所有人都感觉到了不对劲。\n\n" +
      "难道这一切都是有人在背后操纵？";
    const result = analyzeHook(text);
    expect(result.suspenseHitCount).toBeGreaterThan(0);
    expect(result.hasQuestion).toBe(true);
  });

  it("should detect golden line in opening", () => {
    const text =
      "命运从来不会眷顾弱者，唯有强者才能掌握自己的天道！\n\n" +
      "他站在山巅，望着远方的霞光。";
    const result = analyzeHook(text);
    expect(result.hasGoldenLine).toBe(true);
  });

  it("should detect question hook", () => {
    const text =
      "你相信这个世界有神吗？\n\n" +
      "他从一开始就不信。但现在，他不得不信。";
    const result = analyzeHook(text);
    expect(result.hasQuestion).toBe(true);
  });

  it("should detect flat descriptive opening", () => {
    const text =
      "清晨的阳光透过窗户洒在地板上。\n\n" +
      "他慢慢地从床上坐起来，揉了揉眼睛。\n\n" +
      "窗外的小鸟在叽叽喳喳地叫着。";
    const result = analyzeHook(text);
    expect(result.openingType).toBe("description");
    expect(result.conflictHitCount).toBeLessThanOrEqual(1);
  });

  it("should not crash on very short text", () => {
    const result = analyzeHook("一句话开头。");
    expect(result.openingType).toBeDefined();
    expect(result.conflictHitCount).toBeGreaterThanOrEqual(0);
    expect(result.suspenseHitCount).toBeGreaterThanOrEqual(0);
  });

  it("should detect features for high-hook text", () => {
    const text =
      "「杀了他！」\n\n" +
      "一道血光冲天而起，他拼命冲向前方。\n\n" +
      "突然发现了一个惊天秘密，难道这一切都是阴谋？\n\n" +
      "天地不仁，我命由我不由天！\n\n" +
      "他怒吼一声，全力出击。";
    const result = analyzeHook(text);
    expect(result.conflictHitCount).toBeGreaterThan(0);
    expect(result.hasQuestion).toBe(true);
    expect(result.hasGoldenLine).toBe(true);
  });
});
