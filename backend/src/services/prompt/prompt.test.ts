import { describe, it, expect } from "@jest/globals";
import { buildEvaluationPrompt, type SignalData } from "./index";
import type { ClimaxResult } from "../climax";
import type { PacingResult } from "../pacing";
import type { FillerResult } from "../filler";

function createMockSignals(overrides?: {
  climax?: Partial<ClimaxResult>;
  pacing?: Partial<PacingResult>;
  filler?: Partial<FillerResult>;
}): SignalData {
  return {
    climax: {
      score: 7,
      matchedKeywords: ["碾压", "逆袭"],
      keywordCategories: {
        reversal: ["碾压", "逆袭"],
        shock: [],
        breakthrough: [],
        conflict: [],
        emotion: [],
      },
      dialogueDensity: 0.3,
      conflictDensity: 0.5,
      ...overrides?.climax,
    },
    pacing: {
      score: 6,
      curve: [
        { paragraph: 1, tension: 7, type: "action" },
        { paragraph: 2, tension: 5, type: "dialogue" },
        { paragraph: 3, tension: 3, type: "description" },
      ],
      cv: 0.45,
      typeRatio: { action: 0.33, dialogue: 0.33, description: 0.34 },
      ...overrides?.pacing,
    },
    filler: {
      items: [],
      suspiciousPairs: [],
      ...overrides?.filler,
    },
  };
}

describe("buildEvaluationPrompt", () => {
  it("should return a string containing evaluation instruction", () => {
    const signals = createMockSignals();
    const prompt = buildEvaluationPrompt(signals);
    expect(prompt).toContain("专业");
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("hookScore");
    expect(prompt).toContain("climaxScore");
    expect(prompt).toContain("cliffhangerScore");
    expect(prompt).toContain("pacingScore");
  });

  it("should include climax signal data", () => {
    const signals = createMockSignals();
    const prompt = buildEvaluationPrompt(signals);
    expect(prompt).toContain("【爽点分析信号】");
    expect(prompt).toContain("碾压");
    expect(prompt).toContain("逆袭");
    expect(prompt).toContain("对话密度");
    expect(prompt).toContain("冲突密度");
  });

  it("should include pacing signal data", () => {
    const signals = createMockSignals();
    const prompt = buildEvaluationPrompt(signals);
    expect(prompt).toContain("【节奏分析信号】");
    expect(prompt).toContain("变异系数");
    expect(prompt).toContain("类型比例");
    expect(prompt).toContain("平均张力");
  });

  it("should include filler signal data", () => {
    const signals = createMockSignals({
      filler: {
        items: [
          { paragraph: 1, reason: "第1段与第2段内容高度相似（85%）", suggestion: "建议合并" },
        ],
        suspiciousPairs: [
          { paragraphA: 1, paragraphB: 2, similarity: 0.85 },
        ],
      },
    });
    const prompt = buildEvaluationPrompt(signals);
    expect(prompt).toContain("【注水检测信号】");
    expect(prompt).toContain("疑似注水段落: 1 处");
    expect(prompt).toContain("85%");
  });

  it("should handle empty signals gracefully", () => {
    const signals = createMockSignals({
      climax: { score: 0, matchedKeywords: [], keywordCategories: { reversal: [], shock: [], breakthrough: [], conflict: [], emotion: [] }, dialogueDensity: 0, conflictDensity: 0 },
      pacing: { score: 0, curve: [], cv: 0, typeRatio: { action: 0, dialogue: 0, description: 0 } },
      filler: { items: [], suspiciousPairs: [] },
    });
    const prompt = buildEvaluationPrompt(signals);
    expect(prompt).toContain("【爽点分析信号】");
    expect(prompt).toContain("【节奏分析信号】");
    expect(prompt).toContain("【注水检测信号】");
    expect(prompt).toContain("命中关键词: 无");
  });

  it("should include keyword categories when present", () => {
    const signals = createMockSignals({
      climax: {
        score: 8,
        matchedKeywords: ["打脸", "震撼", "突破"],
        keywordCategories: {
          reversal: ["打脸"],
          shock: ["震撼"],
          breakthrough: ["突破"],
          conflict: [],
          emotion: [],
        },
        dialogueDensity: 0.4,
        conflictDensity: 0.6,
      },
    });
    const prompt = buildEvaluationPrompt(signals);
    expect(prompt).toContain("关键词分类:");
    expect(prompt).toContain("reversal: 打脸");
    expect(prompt).toContain("shock: 震撼");
    expect(prompt).toContain("breakthrough: 突破");
  });
});
