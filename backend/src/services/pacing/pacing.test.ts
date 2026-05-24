import { describe, it, expect } from "@jest/globals";
import { analyzePacing } from "./index";

describe("PacingAnalyzer", () => {
  it("should return empty features for empty text", () => {
    const result = analyzePacing("");
    expect(result.curve).toEqual([]);
    expect(result.cv).toBe(0);
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

  it("should expose typeRatio and curve for mixed content", () => {
    const text = [
      "他猛地拔出长剑，朝着敌人劈了过去。剑光一闪，寒气逼人。",
      "「你来了。」「是的，我来了。」「你终于来了。」",
      "远处的山峦在夕阳下显得格外宁静。",
      "他大喝一声，全力出击！一拳打在对方胸口，震得对手倒退三步。",
      "「住手！」「不，今天必须分出胜负！」",
      "战斗结束了，夕阳染红了整片天空。",
    ].join("\n\n");
    const result = analyzePacing(text);
    expect(result.curve.length).toBeGreaterThan(0);
    expect(result.cv).toBeGreaterThanOrEqual(0);
    expect(result.typeRatio).toBeDefined();
  });

  it("should handle pure action text", () => {
    const text = [
      "他猛地拔出长剑，全力劈了过去！",
      "飞身扑上，暴起攻击！",
      "大喝一声，挥拳出击！",
    ].join("\n\n");
    const result = analyzePacing(text);
    expect(result.curve.every((p) => p.type === "action")).toBe(true);
    expect(result.curve.length).toBeGreaterThan(0);
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

  it("should keep all points when 30 or fewer paragraphs", () => {
    const paragraphs: string[] = [];
    for (let i = 0; i < 25; i++) {
      paragraphs.push(`第${i + 1}段的测试内容，包含一些动作词汇如拔出和攻击。`);
    }
    const result = analyzePacing(paragraphs.join("\n\n"));
    expect(result.curve).toHaveLength(25);
    // Paragraph numbers should be sequential
    expect(result.curve[0].paragraph).toBe(1);
    expect(result.curve[24].paragraph).toBe(25);
  });

  it("should downsample to every 2nd point for 31-60 paragraphs", () => {
    const paragraphs: string[] = [];
    for (let i = 0; i < 50; i++) {
      paragraphs.push(
        i % 3 === 0
          ? "他猛地拔出长剑，全力劈了过去！"
          : i % 3 === 1
            ? "「测试对话内容。」「是的。」"
            : "远处的山峦在夕阳下显得格外宁静，微风拂过。"
      );
    }
    const result = analyzePacing(paragraphs.join("\n\n"));
    expect(result.curve.length).toBeLessThanOrEqual(26); // 50/2 = 25 + maybe last
    expect(result.curve.length).toBeGreaterThanOrEqual(25);
    // First and last paragraphs should be present
    expect(result.curve[0].paragraph).toBe(1);
    expect(result.curve[result.curve.length - 1].paragraph).toBe(50);
  });

  it("should downsample to every 3rd point for 61+ paragraphs", () => {
    const paragraphs: string[] = [];
    for (let i = 0; i < 100; i++) {
      paragraphs.push(
        i % 3 === 0
          ? "他猛地拔出长剑，全力劈了过去！暴起攻击敌人。"
          : i % 3 === 1
            ? "「测试对话。」「明白。」"
            : "远处的山峦在夕阳下显得格外宁静。"
      );
    }
    const result = analyzePacing(paragraphs.join("\n\n"));
    expect(result.curve.length).toBeLessThanOrEqual(35); // 100/3 = 33 + maybe last
    expect(result.curve.length).toBeGreaterThanOrEqual(33);
    // First and last paragraphs should be present
    expect(result.curve[0].paragraph).toBe(1);
    expect(result.curve[result.curve.length - 1].paragraph).toBe(100);
  });

  it("should return cv=0 and equal typeRatio for empty text", () => {
    const result = analyzePacing("");
    expect(result.cv).toBe(0);
    expect(result.typeRatio).toEqual({ action: 0, dialogue: 0, description: 0 });
  });
});
