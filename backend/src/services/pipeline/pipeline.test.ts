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

describe("EvaluationPipeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should combine rule engine and LLM results", async () => {
    // Arrange
    mockAnalyzeClimax.mockReturnValue({
      score: 8,
      matchedKeywords: ["打脸", "碾压"],
      dialogueDensity: 0.5,
      conflictDensity: 0.3,
    });
    mockAnalyzePacing.mockReturnValue({
      score: 7,
      curve: [{ paragraph: 1, tension: 5, type: "dialogue" }],
    });
    mockDetectFiller.mockReturnValue({ items: [] });
    mockEvaluateWithLLM.mockResolvedValue({
      hookScore: 9,
      cliffhangerScore: 8,
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

    // Assert
    expect(result.climaxResult.score).toBe(8);
    expect(result.pacingResult.score).toBe(7);
    expect(result.fillerResult.items).toEqual([]);
    expect(result.llmResult.hookScore).toBe(9);
    expect(result.isPartial).toBe(false);
    expect(result.scores.hookScore).toBe(9);
    expect(result.scores.climaxScore).toBe(8);
    expect(result.scores.pacingScore).toBe(7);
  });

  it("should call rule engine and LLM in parallel", async () => {
    // Arrange - 使用延迟模拟并行执行
    let resolveLLM: (value: LLMResult) => void;
    const llmPromise = new Promise<LLMResult>((resolve) => {
      resolveLLM = resolve;
    });

    mockAnalyzeClimax.mockReturnValue({ score: 5, matchedKeywords: [], dialogueDensity: 0, conflictDensity: 0 });
    mockAnalyzePacing.mockReturnValue({ score: 5, curve: [] });
    mockDetectFiller.mockReturnValue({ items: [] });
    mockEvaluateWithLLM.mockReturnValue(llmPromise);

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    const resultPromise = pipeline.evaluateChapter("测试文本");

    // 让微任务执行
    await new Promise((resolve) => setTimeout(resolve, 0));

    // 规则引擎应该已经调用（同步调用在 Promise.resolve().then 中）
    expect(mockAnalyzeClimax).toHaveBeenCalled();
    expect(mockAnalyzePacing).toHaveBeenCalled();
    expect(mockDetectFiller).toHaveBeenCalled();
    // LLM 也应该已经调用
    expect(mockEvaluateWithLLM).toHaveBeenCalled();

    // 完成 LLM
    resolveLLM!({
      hookScore: 6,
      cliffhangerScore: 6,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    });

    const result = await resultPromise;
    expect(result.isPartial).toBe(false);
  });

  it("should return partial results when LLM fails", async () => {
    // Arrange
    mockAnalyzeClimax.mockReturnValue({ score: 7, matchedKeywords: [], dialogueDensity: 0, conflictDensity: 0 });
    mockAnalyzePacing.mockReturnValue({ score: 6, curve: [] });
    mockDetectFiller.mockReturnValue({ items: [] });
    mockEvaluateWithLLM.mockRejectedValue(new Error("API timeout"));

    const pipeline = createEvaluationPipeline({
      analyzeClimax: mockAnalyzeClimax,
      analyzePacing: mockAnalyzePacing,
      detectFiller: mockDetectFiller,
      evaluateWithLLM: mockEvaluateWithLLM,
    });

    // Act
    const result = await pipeline.evaluateChapter("测试文本");

    // Assert
    expect(result.isPartial).toBe(true);
    expect(result.climaxResult.score).toBe(7);
    expect(result.pacingResult.score).toBe(6);
    expect(result.llmResult).toBeNull();
    expect(result.scores.climaxScore).toBe(7);
    expect(result.scores.pacingScore).toBe(6);
  });
});
