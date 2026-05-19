import { describe, it, expect } from "@jest/globals";
import { analyzePacing } from "./index";

describe("PacingAnalyzer", () => {
  it("should return score 0 for empty text", () => {
    const result = analyzePacing("");
    expect(result.score).toBe(0);
    expect(result.curve).toEqual([]);
  });

  it("should classify paragraphs and return pacing curve", () => {
    const text = [
      "他猛地拔出长剑，朝着敌人劈了过去。",
      "「你来了。」「是的，我来了。」",
      "远处的山峦在夕阳下显得格外宁静，微风拂过树梢。",
    ].join("\n\n");
    const result = analyzePacing(text);
    expect(result.curve).toHaveLength(3);
    expect(result.curve[0].type).toBe("action");
    expect(result.curve[1].type).toBe("dialogue");
    expect(result.curve[2].type).toBe("description");
    expect(result.curve[0].tension).toBeGreaterThan(result.curve[2].tension);
  });

  it("should score > 0 for mixed content", () => {
    const text = [
      "他猛地拔出长剑，朝着敌人劈了过去。剑光一闪，寒气逼人。",
      "「你来了。」「是的，我来了。」「你终于来了。」",
      "远处的山峦在夕阳下显得格外宁静。",
      "他大喝一声，全力出击！一拳打在对方胸口，震得对手倒退三步。",
      "「住手！」「不，今天必须分出胜负！」",
      "战斗结束了，夕阳染红了整片天空。",
    ].join("\n\n");
    const result = analyzePacing(text);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it("should handle pure action text", () => {
    const text = [
      "他猛地拔出长剑，全力劈了过去！",
      "飞身扑上，暴起攻击！",
      "大喝一声，挥拳出击！",
    ].join("\n\n");
    const result = analyzePacing(text);
    expect(result.curve.every((p) => p.type === "action")).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("should handle pure dialogue text", () => {
    const text = [
      "「你好。」「你好。」",
      "「今天天气不错。」「是啊。」",
      "「再见。」「再见。」",
    ].join("\n\n");
    const result = analyzePacing(text);
    expect(result.curve.every((p) => p.type === "dialogue")).toBe(true);
  });

  it("should expose cv (coefficient of variation)", () => {
    const text = [
      "他猛地拔出长剑，朝着敌人劈了过去。",
      "「你来了。」「是的，我来了。」",
      "远处的山峦在夕阳下显得格外宁静，微风拂过树梢，鸟儿归巢。",
    ].join("\n\n");
    const result = analyzePacing(text);
    expect(result.cv).toBeDefined();
    expect(result.cv).toBeGreaterThanOrEqual(0);
  });

  it("should expose typeRatio with action/dialogue/description counts", () => {
    const text = [
      "他猛地拔出长剑，朝着敌人劈了过去。",
      "「你来了。」「是的，我来了。」",
      "远处的山峦在夕阳下显得格外宁静。",
    ].join("\n\n");
    const result = analyzePacing(text);
    expect(result.typeRatio).toBeDefined();
    expect(result.typeRatio).toHaveProperty("action");
    expect(result.typeRatio).toHaveProperty("dialogue");
    expect(result.typeRatio).toHaveProperty("description");
    expect(result.typeRatio.action).toBeGreaterThanOrEqual(0);
    expect(result.typeRatio.dialogue).toBeGreaterThanOrEqual(0);
    expect(result.typeRatio.description).toBeGreaterThanOrEqual(0);
    // Sum should be ~1 (ratios, allow rounding)
    const sum = result.typeRatio.action + result.typeRatio.dialogue + result.typeRatio.description;
    expect(sum).toBeCloseTo(1, 1);
  });

  it("should return cv=0 and equal typeRatio for empty text", () => {
    const result = analyzePacing("");
    expect(result.cv).toBe(0);
    expect(result.typeRatio).toEqual({ action: 0, dialogue: 0, description: 0 });
  });
});
