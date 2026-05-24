import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createEvaluationPipeline } from "./index";
import type { ClimaxFeatures } from "../climax";
import type { PacingFeatures } from "../pacing";
import type { FillerFeatures } from "../filler";
import type { LLMResult } from "../llm";
import type { LLMCallResult } from "../llm/client";
import type { HookFeatures } from "../hook";
import type { CliffhangerFeatures } from "../cliffhanger";

// Mock dependencies
const mockAnalyzeClimax = jest.fn<(text: string) => ClimaxFeatures>();
const mockAnalyzePacing = jest.fn<(text: string) => PacingFeatures>();
const mockDetectFiller = jest.fn<(text: string) => FillerFeatures>();
const mockAnalyzeHook = jest.fn<(text: string) => HookFeatures>();
const mockAnalyzeCliffhanger = jest.fn<(text: string) => CliffhangerFeatures>();
const mockEvaluateWithLLM = jest.fn<(text: string, prompt: string) => Promise<LLMCallResult>>();

function wrapLLMResult(result: LLMResult, usage?: { promptTokens: number; completionTokens: number }): LLMCallResult {
  return {
    result,
    usage: usage ?? { promptTokens: 150, completionTokens: 80 },
  };
}

const MOCK_CLIMAX_RESULT: ClimaxFeatures = {
  matchedKeywords: ["打脸", "碾压"],
  keywordCategories: { reversal: ["打脸", "碾压"], shock: [], breakthrough: [], conflict: [], emotion: [] },
  dialogueDensity: 0.5,
  conflictDensity: 0.3,
};

const MOCK_PACING_RESULT: PacingFeatures = {
  curve: [{ paragraph: 1, tension: 5, type: "dialogue" }],
  cv: 0.45,
  typeRatio: { action: 0, dialogue: 1, description: 0 },
};

const MOCK_FILLER_RESULT: FillerFeatures = { items: [], suspiciousPairs: [], truncated: false };

const MOCK_HOOK_RESULT: HookFeatures = {
  openingType: "conflict",
  hasQuestion: false,
  hasGoldenLine: false,
  conflictHitCount: 3,
  suspenseHitCount: 1,
};

const MOCK_CLIFFHANGER_RESULT: CliffhangerFeatures = {
  endingType: "suspense",
  hasQuestion: false,
  hasReversalHint: false,
  suspenseHitCount: 2,
};

describe("EvaluationPipeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyzeClimax.mockReturnValue(MOCK_CLIMAX_RESULT);
    mockAnalyzePacing.mockReturnValue(MOCK_PACING_RESULT);
    mockDetectFiller.mockReturnValue(MOCK_FILLER_RESULT);
    mockAnalyzeHook.mockReturnValue(MOCK_HOOK_RESULT);
    mockAnalyzeCliffhanger.mockReturnValue(MOCK_CLIFFHANGER_RESULT);
  });

  it("should use LLM scores when LLM succeeds (signal injection architecture)", async () => {
    // Arrange — LLM 出全部 4 个分数
    mockEvaluateWithLLM.mockResolvedValue(wrapLLMResult({
      hookScore: 9,
      climaxScore: 8,
      cliffhangerScore: 8,
      pacingScore: 7,
      consistencyIssues: [],
      highlights: ["开头引人入胜"],
      suggestions: [],
    }));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      analyzeHook: mockAnalyzeHook,
      analyzeCliffhanger: mockAnalyzeCliffhanger,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    const result = await pipeline.evaluateChapter("测试文本");

    // Assert — 分数来自 LLM
    expect(result.scores.hookScore).toBe(9);
    expect(result.scores.climaxScore).toBe(8);
    expect(result.scores.cliffhangerScore).toBe(8);
    expect(result.scores.pacingScore).toBe(7);
    expect(result.isPartial).toBe(false);
    expect(result.llmResult).not.toBeNull();
  });

  it("should pass signal-informed prompt to LLM", async () => {
    // Arrange
    mockEvaluateWithLLM.mockResolvedValue(wrapLLMResult({
      hookScore: 5,
      climaxScore: 5,
      cliffhangerScore: 5,
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    }));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      analyzeHook: mockAnalyzeHook,
      analyzeCliffhanger: mockAnalyzeCliffhanger,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    await pipeline.evaluateChapter("测试文本");

    // Assert — LLM 收到的 prompt 应包含规则引擎信号
    const [calledText, calledPrompt] = mockEvaluateWithLLM.mock.calls[0];
    expect(calledText).toBe("测试文本");
    expect(calledPrompt).toContain("【爽点分析信号】");
    expect(calledPrompt).toContain("【节奏分析信号】");
    expect(calledPrompt).toContain("【注水检测信号】");
    expect(calledPrompt).toContain("碾压"); // keyword from climax
  });

  it("should run rule engines before LLM (sequential dependency)", async () => {
    // Arrange
    const callOrder: string[] = [];
    mockAnalyzeClimax.mockImplementation(() => { callOrder.push("climax"); return MOCK_CLIMAX_RESULT; });
    mockAnalyzePacing.mockImplementation(() => { callOrder.push("pacing"); return MOCK_PACING_RESULT; });
    mockDetectFiller.mockImplementation(() => { callOrder.push("filler"); return MOCK_FILLER_RESULT; });
    mockAnalyzeHook.mockImplementation(() => { callOrder.push("hook"); return MOCK_HOOK_RESULT; });
    mockAnalyzeCliffhanger.mockImplementation(() => { callOrder.push("cliffhanger"); return MOCK_CLIFFHANGER_RESULT; });
    mockEvaluateWithLLM.mockImplementation(async () => {
      callOrder.push("llm");
      return wrapLLMResult({
        hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5,
        consistencyIssues: [], highlights: [], suggestions: [],
      });
    });

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      analyzeHook: mockAnalyzeHook,
      analyzeCliffhanger: mockAnalyzeCliffhanger,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    await pipeline.evaluateChapter("测试文本");

    // Assert — 规则引擎先于 LLM 执行
    expect(callOrder).toEqual(["climax", "pacing", "filler", "hook", "cliffhanger", "llm"]);
  });

  it("should fallback to rule engine scores when LLM fails", async () => {
    // Arrange
    mockEvaluateWithLLM.mockRejectedValue(new Error("API timeout"));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      analyzeHook: mockAnalyzeHook,
      analyzeCliffhanger: mockAnalyzeCliffhanger,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    const result = await pipeline.evaluateChapter("测试文本");

    // Assert — 降级到 0（规则引擎已转型为特征提取器，不再产出分数）
    expect(result.isPartial).toBe(true);
    expect(result.llmResult).toBeNull();
    expect(result.scores.climaxScore).toBe(0);
    expect(result.scores.pacingScore).toBe(0);
    expect(result.scores.hookScore).toBe(0);
    expect(result.scores.cliffhangerScore).toBe(0);
    expect(result.hookSource).toBe("rule");
    expect(result.cliffhangerSource).toBe("rule");
  });

  it("should mark hookSource/cliffhangerSource as llm when LLM succeeds", async () => {
    mockEvaluateWithLLM.mockResolvedValue(wrapLLMResult({
      hookScore: 9,
      climaxScore: 8,
      cliffhangerScore: 8,
      pacingScore: 7,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    }));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      analyzeHook: mockAnalyzeHook,
      analyzeCliffhanger: mockAnalyzeCliffhanger,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    const result = await pipeline.evaluateChapter("测试文本");

    expect(result.hookSource).toBe("llm");
    expect(result.cliffhangerSource).toBe("llm");
    expect(result.scores.hookScore).toBe(9);
    expect(result.scores.cliffhangerScore).toBe(8);
  });

  it("should include hook and cliffhanger rule engine results in output", async () => {
    mockEvaluateWithLLM.mockResolvedValue(wrapLLMResult({
      hookScore: 6, climaxScore: 6, cliffhangerScore: 6, pacingScore: 6,
      consistencyIssues: [], highlights: [], suggestions: [],
    }));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      analyzeHook: mockAnalyzeHook,
      analyzeCliffhanger: mockAnalyzeCliffhanger,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    const result = await pipeline.evaluateChapter("测试文本");

    expect(result.hookResult).toBe(MOCK_HOOK_RESULT);
    expect(result.cliffhangerResult).toBe(MOCK_CLIFFHANGER_RESULT);
  });

  describe("onProgress callback", () => {
    it("should call onProgress for all 7 steps in correct order", async () => {
      mockEvaluateWithLLM.mockResolvedValue(wrapLLMResult({
        hookScore: 6, climaxScore: 6, cliffhangerScore: 6, pacingScore: 6,
        consistencyIssues: [], highlights: [], suggestions: [],
      }));

      const progressCalls: { step: number; stepName: string }[] = [];
      const pipeline = createEvaluationPipeline(
        {
          analyzeClimax: mockAnalyzeClimax,
          analyzePacing: mockAnalyzePacing,
          detectFiller: mockDetectFiller,
          analyzeHook: mockAnalyzeHook,
          analyzeCliffhanger: mockAnalyzeCliffhanger,
          evaluateWithLLM: mockEvaluateWithLLM,
        },
        {
          onProgress: (event) => progressCalls.push(event),
        }
      );

      await pipeline.evaluateChapter("测试文本");

      expect(progressCalls.length).toBe(6);
      expect(progressCalls.map((c) => c.step)).toEqual([2, 3, 4, 5, 6, 7]);
      expect(progressCalls.map((c) => c.stepName)).toEqual([
        "分析爽点密度",
        "分析节奏",
        "构建 AI 提示…",
        "调用 AI 分析…",
        "处理 AI 结果…",
        "生成报告",
      ]);
    });

    it("should still call onProgress even when LLM fails", async () => {
      mockEvaluateWithLLM.mockRejectedValue(new Error("API timeout"));

      const progressCalls: { step: number; stepName: string }[] = [];
      const pipeline = createEvaluationPipeline(
        {
          analyzeClimax: mockAnalyzeClimax,
          analyzePacing: mockAnalyzePacing,
          detectFiller: mockDetectFiller,
          analyzeHook: mockAnalyzeHook,
          analyzeCliffhanger: mockAnalyzeCliffhanger,
          evaluateWithLLM: mockEvaluateWithLLM,
        },
        {
          onProgress: (event) => progressCalls.push(event),
        }
      );

      await pipeline.evaluateChapter("测试文本");

      // LLM 失败时仍应触发步骤 4 和 5（LLM 调用前），但步骤 6 会触发（catch 后），步骤 7 也会触发
      expect(progressCalls.length).toBeGreaterThanOrEqual(5);
      const stepNames = progressCalls.map((c) => c.stepName);
      expect(stepNames).toContain("分析爽点密度");
      expect(stepNames).toContain("生成报告");
    });

    it("should not throw when onProgress is not provided (backward compatibility)", async () => {
      mockEvaluateWithLLM.mockResolvedValue(wrapLLMResult({
        hookScore: 6, climaxScore: 6, cliffhangerScore: 6, pacingScore: 6,
        consistencyIssues: [], highlights: [], suggestions: [],
      }));

      const pipeline = createEvaluationPipeline({
        analyzeClimax: mockAnalyzeClimax,
        analyzePacing: mockAnalyzePacing,
        detectFiller: mockDetectFiller,
        analyzeHook: mockAnalyzeHook,
        analyzeCliffhanger: mockAnalyzeCliffhanger,
        evaluateWithLLM: mockEvaluateWithLLM,
      });

      await expect(pipeline.evaluateChapter("测试文本")).resolves.toBeDefined();
    });
  });

  it("should include rule engine results in output", async () => {
    // Arrange
    mockEvaluateWithLLM.mockResolvedValue(wrapLLMResult({
      hookScore: 6, climaxScore: 6, cliffhangerScore: 6, pacingScore: 6,
      consistencyIssues: [], highlights: [], suggestions: [],
    }));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      analyzeHook: mockAnalyzeHook,
      analyzeCliffhanger: mockAnalyzeCliffhanger,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    const result = await pipeline.evaluateChapter("测试文本");

    // Assert — 原始规则引擎结果保留
    expect(result.climaxResult).toBe(MOCK_CLIMAX_RESULT);
    expect(result.pacingResult).toBe(MOCK_PACING_RESULT);
    expect(result.fillerResult).toBe(MOCK_FILLER_RESULT);
  });

  it("should include token usage when LLM succeeds", async () => {
    mockEvaluateWithLLM.mockResolvedValue(wrapLLMResult(
      { hookScore: 8, climaxScore: 7, cliffhangerScore: 6, pacingScore: 6, consistencyIssues: [], highlights: [], suggestions: [] },
      { promptTokens: 1200, completionTokens: 350 }
    ));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      analyzeHook: mockAnalyzeHook,
      analyzeCliffhanger: mockAnalyzeCliffhanger,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    const result = await pipeline.evaluateChapter("测试文本");

    expect(result.tokenUsage).toEqual({ promptTokens: 1200, completionTokens: 350 });
  });

  it("should return null token usage when LLM fails", async () => {
    mockEvaluateWithLLM.mockRejectedValue(new Error("API timeout"));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      analyzeHook: mockAnalyzeHook,
      analyzeCliffhanger: mockAnalyzeCliffhanger,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    const result = await pipeline.evaluateChapter("测试文本");

    expect(result.tokenUsage).toBeNull();
  });
});
