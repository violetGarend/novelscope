import { describe, it, expect } from "@jest/globals";
import { buildEvaluationPrompt, type SignalData, type BuildPromptResult } from "./index";
import type { ClimaxFeatures } from "../climax";
import type { PacingFeatures } from "../pacing";
import type { FillerFeatures } from "../filler";
import type { HookFeatures } from "../hook";
import type { CliffhangerFeatures } from "../cliffhanger";

function createMockSignals(overrides?: {
  climax?: Partial<ClimaxFeatures>;
  pacing?: Partial<PacingFeatures>;
  filler?: Partial<FillerFeatures>;
  hook?: Partial<HookFeatures>;
  cliffhanger?: Partial<CliffhangerFeatures>;
}): SignalData {
  return {
    climax: {
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
    hook: {
      openingType: "conflict",
      hasQuestion: false,
      hasGoldenLine: false,
      conflictHitCount: 3,
      suspenseHitCount: 1,
      ...overrides?.hook,
    },
    cliffhanger: {
      endingType: "suspense",
      hasQuestion: false,
      hasReversalHint: false,
      suspenseHitCount: 2,
      ...overrides?.cliffhanger,
    },
  };
}

describe("buildEvaluationPrompt (v2)", () => {
  // ── 返回类型 ──

  it("should return BuildPromptResult with prompt, needsTruncation, truncatedFeatures", () => {
    const signals = createMockSignals();
    const result = buildEvaluationPrompt(signals);
    expect(result).toHaveProperty("prompt");
    expect(result).toHaveProperty("needsTruncation");
    expect(result).toHaveProperty("truncatedFeatures");
    expect(typeof result.prompt).toBe("string");
    expect(typeof result.needsTruncation).toBe("boolean");
    expect(Array.isArray(result.truncatedFeatures)).toBe(true);
  });

  // ── XML 标签结构 ──

  it("should use XML tags for structural separation", () => {
    const signals = createMockSignals();
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toContain("<instruction>");
    expect(prompt).toContain("</instruction>");
    expect(prompt).toContain("<anchors>");
    expect(prompt).toContain("</anchors>");
    expect(prompt).toContain("<features>");
    expect(prompt).toContain("</features>");
  });

  it("should include per-dimension anchor sections", () => {
    const signals = createMockSignals();
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toContain("<hook_anchors>");
    expect(prompt).toContain("<climax_anchors>");
    expect(prompt).toContain("<cliffhanger_anchors>");
    expect(prompt).toContain("<pacing_anchors>");
  });

  // ── 24 锚点 (4维度 × 6级别) ──

  const expectedAnchors = [
    { dim: "hook", levels: [0, 2, 4, 6, 8, 10] },
    { dim: "climax", levels: [0, 2, 4, 6, 8, 10] },
    { dim: "cliffhanger", levels: [0, 2, 4, 6, 8, 10] },
    { dim: "pacing", levels: [0, 2, 4, 6, 8, 10] },
  ];

  for (const { dim, levels } of expectedAnchors) {
    for (const level of levels) {
      it(`should include ${dim} anchor level ${level}`, () => {
        const signals = createMockSignals();
        const { prompt } = buildEvaluationPrompt(signals);
        expect(prompt).toContain(`[${level}]`);
        // Each anchor should have descriptive text (at least 10 chars beyond the label)
        const anchorPattern = new RegExp(
          `\\[${level}\\].{10,}`,
          "s"
        );
        expect(prompt).toMatch(anchorPattern);
      });
    }
  }

  // ── 软化措辞 ──

  it("should use soft distribution wording instead of forced distribution", () => {
    const signals = createMockSignals();
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toContain("充分利用");
    expect(prompt).not.toContain("必须区分");
  });

  it("should mention full 0-10 range usage", () => {
    const signals = createMockSignals();
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toMatch(/0-10\s*全量程/);
  });

  // ── 5 引擎特征注入 ──

  it("should include all 5 engine features (climax/pacing/filler/hook/cliffhanger)", () => {
    const signals = createMockSignals();
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toContain("爽点分析信号");
    expect(prompt).toContain("节奏分析信号");
    expect(prompt).toContain("注水检测信号");
    expect(prompt).toContain("开头分析信号");
    expect(prompt).toContain("章末悬念信号");
  });

  it("should include hook feature details", () => {
    const signals = createMockSignals({
      hook: { openingType: "conflict", conflictHitCount: 3, suspenseHitCount: 1, hasQuestion: false, hasGoldenLine: false },
    });
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toContain("conflict");
    expect(prompt).toContain("3");
  });

  it("should include cliffhanger feature details", () => {
    const signals = createMockSignals({
      cliffhanger: { endingType: "suspense", suspenseHitCount: 2, hasQuestion: false, hasReversalHint: false },
    });
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toContain("suspense");
    expect(prompt).toContain("2");
  });

  // ── 截断检测 ──

  it("should detect truncation when features are very large", () => {
    // Create massive feature data to trigger truncation
    const massiveKeywords = Array.from({ length: 500 }, (_, i) => `关键词${i}`);
    const signals = createMockSignals({
      climax: {
        matchedKeywords: massiveKeywords,
        keywordCategories: {
          reversal: massiveKeywords.slice(0, 100),
          shock: massiveKeywords.slice(100, 200),
          breakthrough: massiveKeywords.slice(200, 300),
          conflict: massiveKeywords.slice(300, 400),
          emotion: massiveKeywords.slice(400, 500),
        },
      },
    });
    const result = buildEvaluationPrompt(signals);
    expect(result.needsTruncation).toBe(true);
    expect(result.truncatedFeatures.length).toBeGreaterThan(0);
  });

  it("should not flag truncation for normal-sized features", () => {
    const signals = createMockSignals();
    const result = buildEvaluationPrompt(signals);
    expect(result.needsTruncation).toBe(false);
    expect(result.truncatedFeatures).toEqual([]);
  });

  it("should include truncated feature names in the report", () => {
    const massiveKeywords = Array.from({ length: 500 }, (_, i) => `关键词${i}`);
    const signals = createMockSignals({
      climax: {
        matchedKeywords: massiveKeywords,
        keywordCategories: {
          reversal: massiveKeywords.slice(0, 100),
          shock: massiveKeywords.slice(100, 200),
          breakthrough: massiveKeywords.slice(200, 300),
          conflict: massiveKeywords.slice(300, 400),
          emotion: massiveKeywords.slice(400, 500),
        },
      },
    });
    const result = buildEvaluationPrompt(signals);
    expect(result.truncatedFeatures).toContain("爽点分析");
  });

  // ── JSON 输出指令 ──

  it("should still request JSON output format", () => {
    const signals = createMockSignals();
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toContain("JSON");
  });

  it("should include all four score dimensions in output instruction", () => {
    const signals = createMockSignals();
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toContain("hookScore");
    expect(prompt).toContain("climaxScore");
    expect(prompt).toContain("cliffhangerScore");
    expect(prompt).toContain("pacingScore");
  });

  // ── 一致性 + 建议字段 ──

  it("should request consistency issues, highlights, and graded suggestions", () => {
    const signals = createMockSignals();
    const { prompt } = buildEvaluationPrompt(signals);
    expect(prompt).toContain("consistencyIssues");
    expect(prompt).toContain("highlights");
    expect(prompt).toContain("suggestions");
    expect(prompt).toContain("severity");
  });

  // ── v1 fallback ──

  it("should use v1 prompt format when useV1 config is true", () => {
    const signals = createMockSignals();
    // v1 只接受 climax/pacing/filler（不含 hook/cliffhanger）
    const v1Result = buildEvaluationPrompt(signals, { useV1: true });
    expect(v1Result.prompt).not.toContain("<anchors>");
    expect(v1Result.prompt).not.toContain("<features>");
    expect(v1Result.prompt).toContain("【爽点分析信号】");
    expect(v1Result.needsTruncation).toBe(false);
    expect(v1Result.truncatedFeatures).toEqual([]);
  });

  it("should still include hook/cliffhanger features in v1 signal formatting", () => {
    const signals = createMockSignals();
    const v1Result = buildEvaluationPrompt(signals, { useV1: true });
    // v1 format should include hook and cliffhanger signal sections
    expect(v1Result.prompt).toContain("开头分析信号");
    expect(v1Result.prompt).toContain("章末悬念信号");
  });

  // ── 空信号处理 ──

  it("should handle completely empty signals gracefully", () => {
    const signals = createMockSignals({
      climax: { matchedKeywords: [], keywordCategories: { reversal: [], shock: [], breakthrough: [], conflict: [], emotion: [] }, dialogueDensity: 0, conflictDensity: 0 },
      pacing: { curve: [], cv: 0, typeRatio: { action: 0, dialogue: 0, description: 0 } },
      filler: { items: [], suspiciousPairs: [] },
      hook: { openingType: "description", hasQuestion: false, hasGoldenLine: false, conflictHitCount: 0, suspenseHitCount: 0 },
      cliffhanger: { endingType: "flat", hasQuestion: false, hasReversalHint: false, suspenseHitCount: 0 },
    });
    const result = buildEvaluationPrompt(signals);
    expect(result.needsTruncation).toBe(false);
    expect(typeof result.prompt).toBe("string");
    expect(result.prompt.length).toBeGreaterThan(0);
  });
});
