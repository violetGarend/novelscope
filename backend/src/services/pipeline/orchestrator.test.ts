import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { ClimaxFeatures } from "../climax";
import type { PacingFeatures } from "../pacing";
import type { FillerFeatures } from "../filler";
import type { HookFeatures } from "../hook";
import type { CliffhangerFeatures } from "../cliffhanger";
import type { LLMCallResult, TokenUsage } from "../llm/client";
import type { LLMResult } from "../llm";
import type { ValidatedScores } from "../guard";
import type { SignalData } from "../prompt";

// We'll import from the orchestrator module once created
// For now, define what we expect the interface to look like

import type {
  DualModelScores,
  DimensionScores,
  DivergenceReport,
  EvaluationResultV2,
  DualModelDependencies,
  DualModelPipeline,
} from "./types";

import { createDualModelPipeline } from "./orchestrator";
import { detectDivergence, generateDegradedReport, pickScores } from "./orchestrator";

// ── Mock helpers ──

const MOCK_CLIMAX: ClimaxFeatures = {
  matchedKeywords: ["打脸"],
  keywordCategories: { reversal: ["打脸"], shock: [], breakthrough: [], conflict: [], emotion: [] },
  dialogueDensity: 0.3,
  conflictDensity: 0.5,
};

const MOCK_PACING: PacingFeatures = {
  curve: [{ paragraph: 1, tension: 7, type: "action" }],
  cv: 0.45,
  typeRatio: { action: 0.33, dialogue: 0.33, description: 0.34 },
};

const MOCK_FILLER: FillerFeatures = { items: [], suspiciousPairs: [] };

const MOCK_HOOK: HookFeatures = {
  openingType: "conflict",
  hasQuestion: false,
  hasGoldenLine: false,
  conflictHitCount: 3,
  suspenseHitCount: 1,
};

const MOCK_CLIFFHANGER: CliffhangerFeatures = {
  endingType: "suspense",
  hasQuestion: false,
  hasReversalHint: false,
  suspenseHitCount: 2,
};

function makeSignals(overrides?: Partial<{
  climax: Partial<ClimaxFeatures>;
  pacing: Partial<PacingFeatures>;
  filler: Partial<FillerFeatures>;
  hook: Partial<HookFeatures>;
  cliffhanger: Partial<CliffhangerFeatures>;
}>): SignalData {
  return {
    climax: { ...MOCK_CLIMAX, ...overrides?.climax },
    pacing: { ...MOCK_PACING, ...overrides?.pacing },
    filler: { ...MOCK_FILLER, ...overrides?.filler },
    hook: { ...MOCK_HOOK, ...overrides?.hook },
    cliffhanger: { ...MOCK_CLIFFHANGER, ...overrides?.cliffhanger },
  };
}

function makeLLMResult(scores: Partial<DimensionScores>, overrides?: Partial<LLMResult>): LLMResult {
  return {
    hookScore: scores.hookScore ?? 5,
    climaxScore: scores.climaxScore ?? 5,
    cliffhangerScore: scores.cliffhangerScore ?? 5,
    pacingScore: scores.pacingScore ?? 5,
    consistencyIssues: [],
    highlights: [],
    suggestions: [],
    ...overrides,
  };
}

function makeLLMCallResult(
  scores: Partial<DimensionScores>,
  usage?: Partial<TokenUsage>
): LLMCallResult {
  return {
    result: makeLLMResult(scores),
    usage: {
      promptTokens: usage?.promptTokens ?? 150,
      completionTokens: usage?.completionTokens ?? 80,
    },
  };
}

// ── detectDivergence tests ──

describe("detectDivergence", () => {
  it("returns empty array when both models agree (delta <= 2)", () => {
    const a: DimensionScores = { hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7 };
    const b: DimensionScores = { hookScore: 8, climaxScore: 6, cliffhangerScore: 8, pacingScore: 6 };
    const result = detectDivergence(a, b);
    expect(result).toEqual([]);
  });

  it("detects divergence when delta > 2", () => {
    const a: DimensionScores = { hookScore: 8, climaxScore: 8, cliffhangerScore: 8, pacingScore: 8 };
    const b: DimensionScores = { hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
    const result = detectDivergence(a, b);
    expect(result.length).toBe(4);
    expect(result[0]).toEqual({ dimension: "hookScore", deepseek: 8, doubao: 5, delta: 3 });
  });

  it("does NOT flag delta of exactly 2.0", () => {
    const a: DimensionScores = { hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7 };
    const b: DimensionScores = { hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
    const result = detectDivergence(a, b);
    expect(result).toEqual([]);
  });

  it("flags only diverging dimensions", () => {
    const a: DimensionScores = { hookScore: 9, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
    const b: DimensionScores = { hookScore: 4, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 };
    const result = detectDivergence(a, b);
    expect(result.length).toBe(1);
    expect(result[0].dimension).toBe("hookScore");
    expect(result[0].delta).toBe(5);
  });
});

// ── pickScores tests ──

describe("pickScores", () => {
  it("averages two sets of scores for dual success", () => {
    const a: DimensionScores = { hookScore: 8, climaxScore: 6, cliffhangerScore: 9, pacingScore: 7 };
    const b: DimensionScores = { hookScore: 6, climaxScore: 8, cliffhangerScore: 7, pacingScore: 5 };
    const result = pickScores(a, b);
    expect(result.hookScore).toBe(7);
    expect(result.climaxScore).toBe(7);
    expect(result.cliffhangerScore).toBe(8);
    expect(result.pacingScore).toBe(6);
  });
});

// ── generateDegradedReport tests ──

describe("generateDegradedReport", () => {
  it("returns a non-empty Chinese report string", () => {
    const signals = makeSignals();
    const report = generateDegradedReport(signals, "所有模型不可用");
    expect(typeof report).toBe("string");
    expect(report.length).toBeGreaterThan(50);
    expect(/[一-鿿]/.test(report)).toBe(true);
  });

  it("mentions the reason in the report", () => {
    const signals = makeSignals();
    const report = generateDegradedReport(signals, "API超时");
    expect(report).toContain("API超时");
  });

  it("includes feature-based qualitative descriptions", () => {
    const signals = makeSignals();
    const report = generateDegradedReport(signals, "测试");
    expect(report).toContain("开头分析");
    expect(report).toContain("爽点分析");
    expect(report).toContain("节奏分析");
    expect(report).toContain("章末悬念");
  });
});

// ── Dual Model Pipeline tests ──

describe("createDualModelPipeline", () => {
  let mockEvaluateA: jest.Mock<(t: string, p: string) => Promise<LLMCallResult>>;
  let mockEvaluateB: jest.Mock<(t: string, p: string) => Promise<LLMCallResult>>;
  let deps: DualModelDependencies;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEvaluateA = jest.fn<(t: string, p: string) => Promise<LLMCallResult>>();
    mockEvaluateB = jest.fn<(t: string, p: string) => Promise<LLMCallResult>>();

    deps = {
      analyzeClimax: jest.fn(() => MOCK_CLIMAX),
      analyzePacing: jest.fn(() => MOCK_PACING),
      detectFiller: jest.fn(() => MOCK_FILLER),
      analyzeHook: jest.fn(() => MOCK_HOOK),
      analyzeCliffhanger: jest.fn(() => MOCK_CLIFFHANGER),
      evaluateModelA: mockEvaluateA,
      evaluateModelB: mockEvaluateB,
    };
  });

  // ── complete: 双成功 ──

  it("returns status=complete when both models succeed", async () => {
    mockEvaluateA.mockResolvedValue(makeLLMCallResult({ hookScore: 8, climaxScore: 7, cliffhangerScore: 8, pacingScore: 7 }));
    mockEvaluateB.mockResolvedValue(makeLLMCallResult({ hookScore: 6, climaxScore: 7, cliffhangerScore: 6, pacingScore: 5 }));

    const pipeline = createDualModelPipeline(deps);
    const result = await pipeline.evaluateChapter("测试文本");

    expect(result.status).toBe("complete");
    if (result.status === "complete") {
      expect(result.scores.deepseek).toBeDefined();
      expect(result.scores.doubao).toBeDefined();
      expect(result.scores.deepseek.hookScore).toBe(8);
      expect(result.scores.doubao.hookScore).toBe(6);
    }
  });

  it("calls both models in parallel", async () => {
    mockEvaluateA.mockResolvedValue(makeLLMCallResult({ hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 }));
    mockEvaluateB.mockResolvedValue(makeLLMCallResult({ hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 }));

    const pipeline = createDualModelPipeline(deps);
    await pipeline.evaluateChapter("测试");

    expect(mockEvaluateA).toHaveBeenCalledTimes(1);
    expect(mockEvaluateB).toHaveBeenCalledTimes(1);
  });

  it("includes divergence report when delta > 2", async () => {
    mockEvaluateA.mockResolvedValue(makeLLMCallResult({ hookScore: 9, climaxScore: 9, cliffhangerScore: 9, pacingScore: 9 }));
    mockEvaluateB.mockResolvedValue(makeLLMCallResult({ hookScore: 3, climaxScore: 4, cliffhangerScore: 5, pacingScore: 2 }));

    const pipeline = createDualModelPipeline(deps);
    const result = await pipeline.evaluateChapter("测试");

    expect(result.status).toBe("complete");
    if (result.status === "complete") {
      expect(result.divergence).toBeDefined();
      expect(result.divergence!.length).toBeGreaterThan(0);
    }
  });

  // ── partial: 一成一败 ──

  it("returns status=partial when model A fails", async () => {
    mockEvaluateA.mockRejectedValue(new Error("Timeout"));
    mockEvaluateB.mockResolvedValue(makeLLMCallResult({ hookScore: 7, climaxScore: 6, cliffhangerScore: 7, pacingScore: 6 }));

    const pipeline = createDualModelPipeline(deps);
    const result = await pipeline.evaluateChapter("测试");

    expect(result.status).toBe("partial");
    if (result.status === "partial") {
      expect(result.failedModel).toBe("A");
      expect(result.scores.hookScore).toBe(7);
    }
  });

  it("returns status=partial when model B fails", async () => {
    mockEvaluateA.mockResolvedValue(makeLLMCallResult({ hookScore: 8, climaxScore: 7, cliffhangerScore: 8, pacingScore: 7 }));
    mockEvaluateB.mockRejectedValue(new Error("Rate limit"));

    const pipeline = createDualModelPipeline(deps);
    const result = await pipeline.evaluateChapter("测试");

    expect(result.status).toBe("partial");
    if (result.status === "partial") {
      expect(result.failedModel).toBe("B");
    }
  });

  // ── degraded: 双双失败 ──

  it("returns status=degraded when both models fail", async () => {
    mockEvaluateA.mockRejectedValue(new Error("Timeout"));
    mockEvaluateB.mockRejectedValue(new Error("Timeout"));

    const pipeline = createDualModelPipeline(deps);
    const result = await pipeline.evaluateChapter("测试");

    expect(result.status).toBe("degraded");
    if (result.status === "degraded") {
      expect(typeof result.report).toBe("string");
      expect(result.report.length).toBeGreaterThan(0);
    }
  });

  // ── 截断循环 ──

  it("handles truncation loop when features are oversized", async () => {
    mockEvaluateA.mockResolvedValue(makeLLMCallResult({ hookScore: 8, climaxScore: 7, cliffhangerScore: 8, pacingScore: 7 }));
    mockEvaluateB.mockResolvedValue(makeLLMCallResult({ hookScore: 6, climaxScore: 7, cliffhangerScore: 6, pacingScore: 5 }));

    const pipeline = createDualModelPipeline(deps);
    const result = await pipeline.evaluateChapter("测试文本");
    // Should not crash with any feature size
    expect(["complete", "partial", "degraded"]).toContain(result.status);
  });

  // ── Features output ──

  it("includes all feature results in output", async () => {
    mockEvaluateA.mockResolvedValue(makeLLMCallResult({ hookScore: 8, climaxScore: 7, cliffhangerScore: 8, pacingScore: 7 }));
    mockEvaluateB.mockResolvedValue(makeLLMCallResult({ hookScore: 6, climaxScore: 7, cliffhangerScore: 6, pacingScore: 5 }));

    const pipeline = createDualModelPipeline(deps);
    const result = await pipeline.evaluateChapter("测试");

    expect(result.features.climax).toBeDefined();
    expect(result.features.pacing).toBeDefined();
    expect(result.features.filler).toBeDefined();
    expect(result.features.hook).toBeDefined();
    expect(result.features.cliffhanger).toBeDefined();
  });

  // ── Token usage ──

  it("includes dual token usage for complete status", async () => {
    mockEvaluateA.mockResolvedValue(makeLLMCallResult({ hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 }, { promptTokens: 200, completionTokens: 100 }));
    mockEvaluateB.mockResolvedValue(makeLLMCallResult({ hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 }, { promptTokens: 300, completionTokens: 150 }));

    const pipeline = createDualModelPipeline(deps);
    const result = await pipeline.evaluateChapter("测试");

    expect(result.status).toBe("complete");
    if (result.status === "complete") {
      expect(result.tokenUsage.deepseek).toEqual({ promptTokens: 200, completionTokens: 100 });
      expect(result.tokenUsage.doubao).toEqual({ promptTokens: 300, completionTokens: 150 });
    }
  });

  // ── onProgress ──

  it("emits progress events", async () => {
    mockEvaluateA.mockResolvedValue(makeLLMCallResult({ hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 }));
    mockEvaluateB.mockResolvedValue(makeLLMCallResult({ hookScore: 5, climaxScore: 5, cliffhangerScore: 5, pacingScore: 5 }));

    const progressEvents: { step: number; stepName: string }[] = [];
    const pipeline = createDualModelPipeline(deps, { onProgress: (e) => progressEvents.push(e) });
    await pipeline.evaluateChapter("测试");

    expect(progressEvents.length).toBeGreaterThan(0);
    const steps = progressEvents.map((e) => e.step);
    expect(steps).toContain(5); // LLM evaluation step
    expect(steps).toContain(7); // report generation step
  });
});
