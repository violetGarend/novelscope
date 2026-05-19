import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createEvaluationPipeline, type EvaluationResult } from "./index";
import type { ClimaxResult } from "../climax";
import type { PacingResult } from "../pacing";
import type { FillerResult } from "../filler";
import type { LLMResult } from "../llm";

// Mock dependencies
const mockAnalyzeClimax = jest.fn<(text: string) => ClimaxResult>();
const mockAnalyzePacing = jest.fn<(text: string) => PacingResult>();
const mockDetectFiller = jest.fn<(text: string) => FillerResult>();
const mockEvaluateWithLLM = jest.fn<(text: string, prompt: string) => Promise<LLMResult>>();

const MOCK_CLIMAX_RESULT: ClimaxResult = {
  score: 8,
  matchedKeywords: ["打脸", "碾压"],
  keywordCategories: { reversal: ["打脸", "碾压"], shock: [], breakthrough: [], conflict: [], emotion: [] },
  dialogueDensity: 0.5,
  conflictDensity: 0.3,
};

const MOCK_PACING_RESULT: PacingResult = {
  score: 7,
  curve: [{ paragraph: 1, tension: 5, type: "dialogue" }],
  cv: 0.45,
  typeRatio: { action: 0, dialogue: 1, description: 0 },
};

const MOCK_FILLER_RESULT: FillerResult = { items: [], suspiciousPairs: [] };

describe("EvaluationPipeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyzeClimax.mockReturnValue(MOCK_CLIMAX_RESULT);
    mockAnalyzePacing.mockReturnValue(MOCK_PACING_RESULT);
    mockDetectFiller.mockReturnValue(MOCK_FILLER_RESULT);
  });

  it("should use LLM scores when LLM succeeds (signal injection architecture)", async () => {
    // Arrange — LLM 出全部 4 个分数
    mockEvaluateWithLLM.mockResolvedValue({
      hookScore: 9,
      climaxScore: 8,
      cliffhangerScore: 8,
      pacingScore: 7,
      consistencyIssues: [],
      highlights: ["开头引人入胜"],
      suggestions: [],
    });

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
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
    mockEvaluateWithLLM.mockResolvedValue({
      hookScore: 5,
      climaxScore: 5,
      cliffhangerScore: 5,
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    });

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
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
    mockEvaluateWithLLM.mockImplementation(async () => {
      callOrder.push("llm");
      return {
        hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5,
        consistencyIssues: [], highlights: [], suggestions: [],
      };
    });

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    await pipeline.evaluateChapter("测试文本");

    // Assert — 规则引擎先于 LLM 执行
    expect(callOrder).toEqual(["climax", "pacing", "filler", "llm"]);
  });

  it("should fallback to rule engine scores when LLM fails", async () => {
    // Arrange
    mockEvaluateWithLLM.mockRejectedValue(new Error("API timeout"));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    const result = await pipeline.evaluateChapter("测试文本");

    // Assert — 降级到规则引擎分数
    expect(result.isPartial).toBe(true);
    expect(result.llmResult).toBeNull();
    expect(result.scores.climaxScore).toBe(8); // from rule engine
    expect(result.scores.pacingScore).toBe(7); // from rule engine
  });

  describe("onProgress callback", () => {
    it("should call onProgress for all 7 steps in correct order", async () => {
      mockEvaluateWithLLM.mockResolvedValue({
        hookScore: 6, climaxScore: 6, cliffhangerScore: 6, pacingScore: 6,
        consistencyIssues: [], highlights: [], suggestions: [],
      });

      const progressCalls: { step: number; stepName: string }[] = [];
      const pipeline = createEvaluationPipeline(
        {
          analyzeClimax: mockAnalyzeClimax,
          analyzePacing: mockAnalyzePacing,
          detectFiller: mockDetectFiller,
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
        "评估Hook强度",
        "评估章末悬念",
        "检查一致性",
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
      mockEvaluateWithLLM.mockResolvedValue({
        hookScore: 6, climaxScore: 6, cliffhangerScore: 6, pacingScore: 6,
        consistencyIssues: [], highlights: [], suggestions: [],
      });

      const pipeline = createEvaluationPipeline({
        analyzeClimax: mockAnalyzeClimax,
        analyzePacing: mockAnalyzePacing,
        detectFiller: mockDetectFiller,
        evaluateWithLLM: mockEvaluateWithLLM,
      });

      await expect(pipeline.evaluateChapter("测试文本")).resolves.toBeDefined();
    });
  });

  it("should include rule engine results in output", async () => {
    // Arrange
    mockEvaluateWithLLM.mockResolvedValue({
      hookScore: 6, climaxScore: 6, cliffhangerScore: 6, pacingScore: 6,
      consistencyIssues: [], highlights: [], suggestions: [],
    });

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    const result = await pipeline.evaluateChapter("测试文本");

    // Assert — 原始规则引擎结果保留
    expect(result.climaxResult).toBe(MOCK_CLIMAX_RESULT);
    expect(result.pacingResult).toBe(MOCK_PACING_RESULT);
    expect(result.fillerResult).toBe(MOCK_FILLER_RESULT);
  });
});
