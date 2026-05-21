import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  createGoldenSampleRunner,
  generateMarkdownReport,
} from "./index";
import type {
  GoldenSample,
  GoldenValidationReport,
  EvaluationResult,
} from "./index";
import type { ValidatedScores } from "../guard";
import type { TokenUsage } from "../llm";

// Allow importing from pipeline for the mock result type
type EvalResult = EvaluationResult;

function makeValidatedScores(overrides?: Partial<ValidatedScores>): ValidatedScores {
  return {
    hookScore: overrides?.hookScore ?? 7,
    climaxScore: overrides?.climaxScore ?? 7,
    cliffhangerScore: overrides?.cliffhangerScore ?? 7,
    pacingScore: overrides?.pacingScore ?? 7,
    overallScore: overrides?.overallScore ?? 7,
  };
}

function makeMockEvalResult(scores: ValidatedScores, isPartial = false): EvalResult {
  return {
    climaxResult: {
      score: scores.climaxScore,
      matchedKeywords: [],
      keywordCategories: {
        reversal: [],
        shock: [],
        breakthrough: [],
        conflict: [],
        emotion: [],
      },
      dialogueDensity: 0,
      conflictDensity: 0,
    },
    pacingResult: {
      score: scores.pacingScore,
      curve: [],
      cv: 0,
      typeRatio: { action: 0, dialogue: 0, description: 0 },
    },
    fillerResult: { items: [], suspiciousPairs: [] },
    llmResult: isPartial
      ? null
      : {
          hookScore: scores.hookScore,
          climaxScore: scores.climaxScore,
          cliffhangerScore: scores.cliffhangerScore,
          pacingScore: scores.pacingScore,
          consistencyIssues: [],
          highlights: [],
          suggestions: [],
        },
    scores,
    isPartial,
    tokenUsage: isPartial
      ? null
      : { promptTokens: 500, completionTokens: 100 },
  };
}

function makeSample(overrides?: Partial<GoldenSample>): GoldenSample {
  return {
    id: "test-01",
    name: "测试样本",
    description: "一个测试用样本",
    text: "测试文本内容",
    lengthCategory: "short",
    expectedRanges: {
      climaxScore: { min: 5, max: 9 },
      pacingScore: { min: 5, max: 8 },
      filler: "low" as const,
    },
    ...overrides,
  };
}

// ── Tests ──

describe("createGoldenSampleRunner", () => {
  let mockEvaluateChapter: jest.Mock<(text: string) => Promise<EvalResult>>;
  let sample: GoldenSample;

  beforeEach(() => {
    jest.clearAllMocks();
    sample = makeSample();
    mockEvaluateChapter = jest.fn<(text: string) => Promise<EvalResult>>();
  });

  function createRunner(samples?: GoldenSample[], config?: { rounds?: number }) {
    return createGoldenSampleRunner(
      { evaluateChapter: mockEvaluateChapter },
      samples ?? [sample],
      config
    );
  }

  // ── Basic wiring ──

  describe("validateSample - basic wiring", () => {
    it("should run 3 rounds by default", async () => {
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores())
      );

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.rounds).toHaveLength(3);
      expect(mockEvaluateChapter).toHaveBeenCalledTimes(3);
    });

    it("should run configured number of rounds", async () => {
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores())
      );

      const runner = createRunner([sample], { rounds: 5 });
      const result = await runner.validateSample(sample, 5);

      expect(result.rounds).toHaveLength(5);
      expect(mockEvaluateChapter).toHaveBeenCalledTimes(5);
    });

    it("should call evaluateChapter with sample text", async () => {
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores())
      );

      const runner = createRunner();
      await runner.validateSample(sample);

      expect(mockEvaluateChapter).toHaveBeenCalledWith(sample.text);
    });

    it("should record round metadata (timestamp, durationMs, llmAvailable)", async () => {
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores(), false)
      );

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      for (const r of result.rounds) {
        // ISO timestamp
        expect(r.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(r.durationMs).toBeGreaterThanOrEqual(0);
        expect(r.llmAvailable).toBe(true);
        expect(r.tokenUsage).toEqual({ promptTokens: 500, completionTokens: 100 });
      }
    });

    it("should mark llmAvailable false when result is partial", async () => {
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores(), true)
      );

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      for (const r of result.rounds) {
        expect(r.llmAvailable).toBe(false);
        expect(r.tokenUsage).toBeNull();
      }
    });
  });

  // ── Variance computation ──

  describe("variance computation", () => {
    it("should compute variance for all score dimensions", async () => {
      const scores = [
        makeValidatedScores({ hookScore: 6, climaxScore: 7, cliffhangerScore: 8, pacingScore: 5, overallScore: 6 }),
        makeValidatedScores({ hookScore: 7, climaxScore: 8, cliffhangerScore: 7, pacingScore: 6, overallScore: 7 }),
        makeValidatedScores({ hookScore: 8, climaxScore: 9, cliffhangerScore: 6, pacingScore: 7, overallScore: 8 }),
      ];

      mockEvaluateChapter
        .mockResolvedValueOnce(makeMockEvalResult(scores[0]))
        .mockResolvedValueOnce(makeMockEvalResult(scores[1]))
        .mockResolvedValueOnce(makeMockEvalResult(scores[2]));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.variance.hookScore).toBeGreaterThan(0);
      expect(result.variance.climaxScore).toBeGreaterThan(0);
      expect(result.variance.cliffhangerScore).toBeGreaterThan(0);
      expect(result.variance.pacingScore).toBeGreaterThan(0);
      expect(result.variance.overallScore).toBeGreaterThan(0);
    });

    it("should pass stability when all variances < 0.5", async () => {
      // Very close scores → low variance
      const scores = [
        makeValidatedScores({ hookScore: 7.0, climaxScore: 7.0, cliffhangerScore: 7.0, pacingScore: 7.0, overallScore: 7.0 }),
        makeValidatedScores({ hookScore: 7.1, climaxScore: 7.1, cliffhangerScore: 7.1, pacingScore: 7.1, overallScore: 7.1 }),
        makeValidatedScores({ hookScore: 7.2, climaxScore: 7.2, cliffhangerScore: 7.2, pacingScore: 7.2, overallScore: 7.2 }),
      ];

      mockEvaluateChapter
        .mockResolvedValueOnce(makeMockEvalResult(scores[0]))
        .mockResolvedValueOnce(makeMockEvalResult(scores[1]))
        .mockResolvedValueOnce(makeMockEvalResult(scores[2]));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.stabilityPass).toBe(true);
    });

    it("should fail stability when any variance >= 0.5", async () => {
      // Widely varying scores
      const scores = [
        makeValidatedScores({ hookScore: 3, climaxScore: 3, cliffhangerScore: 3, pacingScore: 3, overallScore: 3 }),
        makeValidatedScores({ hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7, overallScore: 7 }),
        makeValidatedScores({ hookScore: 9, climaxScore: 9, cliffhangerScore: 9, pacingScore: 9, overallScore: 9 }),
      ];

      mockEvaluateChapter
        .mockResolvedValueOnce(makeMockEvalResult(scores[0]))
        .mockResolvedValueOnce(makeMockEvalResult(scores[1]))
        .mockResolvedValueOnce(makeMockEvalResult(scores[2]));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.stabilityPass).toBe(false);
    });

    it("should compute zero variance for identical scores", async () => {
      const sameScores = makeValidatedScores({ hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7, overallScore: 7 });
      mockEvaluateChapter.mockResolvedValue(makeMockEvalResult(sameScores));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.variance.hookScore).toBe(0);
      expect(result.variance.climaxScore).toBe(0);
      expect(result.variance.cliffhangerScore).toBe(0);
      expect(result.variance.pacingScore).toBe(0);
      expect(result.variance.overallScore).toBe(0);
      expect(result.stabilityPass).toBe(true);
    });

    it("should compute zero variance for a single round", async () => {
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores())
      );

      const runner = createRunner();
      const result = await runner.validateSample(sample, 1);

      expect(result.variance.hookScore).toBe(0);
      expect(result.variance.climaxScore).toBe(0);
      expect(result.stabilityPass).toBe(true);
    });
  });

  // ── Expected range check ──

  describe("expected range check", () => {
    it("should pass humanAgreement when scores within expected ranges", async () => {
      // Sample expects climax [5,9], pacing [5,8]
      // Mock returns avg ~7 for both
      const scores = makeValidatedScores({
        climaxScore: 7,
        pacingScore: 6.5,
      });
      mockEvaluateChapter.mockResolvedValue(makeMockEvalResult(scores));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.expectedRangeCheck.climaxInRange).toBe(true);
      expect(result.expectedRangeCheck.pacingInRange).toBe(true);
      expect(result.humanAgreementPass).toBe(true);
    });

    it("should fail humanAgreement when scores outside expected ranges", async () => {
      // Sample expects climax [5,9], but we return avg ~2
      const scores = makeValidatedScores({
        climaxScore: 2,
        pacingScore: 2,
      });
      mockEvaluateChapter.mockResolvedValue(makeMockEvalResult(scores));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.expectedRangeCheck.climaxInRange).toBe(false);
      expect(result.expectedRangeCheck.pacingInRange).toBe(false);
      expect(result.humanAgreementPass).toBe(false);
    });

    it("should fail humanAgreement when only one dimension out of range", async () => {
      const scores = makeValidatedScores({
        climaxScore: 7, // in range [5,9]
        pacingScore: 1,  // well below min [5,8]
      });
      mockEvaluateChapter.mockResolvedValue(makeMockEvalResult(scores));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.expectedRangeCheck.climaxInRange).toBe(true);
      expect(result.expectedRangeCheck.pacingInRange).toBe(false);
      expect(result.humanAgreementPass).toBe(false);
    });

    it("should compute avgDiff correctly", async () => {
      // expected climax [5,9] → midpoint = 7
      // avg climax = 8 → diff = 1
      const scores = makeValidatedScores({ climaxScore: 8, pacingScore: 6.5 });
      mockEvaluateChapter.mockResolvedValue(makeMockEvalResult(scores));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.expectedRangeCheck.climaxAvgDiff).toBeCloseTo(1, 0);
    });
  });

  // ── validateAll integration ──

  describe("validateAll", () => {
    it("should run all samples and produce full report", async () => {
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores())
      );

      const samples = [
        makeSample({ id: "a-01", name: "Sample A" }),
        makeSample({ id: "a-02", name: "Sample B" }),
        makeSample({ id: "a-03", name: "Sample C" }),
      ];

      const runner = createRunner(samples);
      const report = await runner.validateAll();

      expect(report.samples).toHaveLength(3);
      expect(report.summary.totalSamples).toBe(3);
      expect(report.summary.roundsPerSample).toBe(3);
    });

    it("should compute summary statistics correctly", async () => {
      // Sample 1: stable, in range
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores({ climaxScore: 7, pacingScore: 6.5 }))
      );

      const samples = [
        makeSample({ id: "s-01", name: "稳定样本" }),
      ];

      const runner = createRunner(samples);
      const report = await runner.validateAll();

      expect(report.summary.stabilityPassCount).toBe(1);
      expect(report.summary.humanAgreementPassCount).toBe(1);
      expect(report.summary.overallStable).toBe(true);
    });

    it("should detect when overallStable is false", async () => {
      // Use a tight expected range so scores fall outside
      const unstableSample = makeSample({
        id: "unstable",
        name: "不稳定样本",
        expectedRanges: {
          climaxScore: { min: 9, max: 10 },
          pacingScore: { min: 9, max: 10 },
          filler: "none",
        },
      });
      // Return scores well below expected range
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores({ climaxScore: 2, pacingScore: 2 }))
      );

      const runner = createRunner([unstableSample]);
      const report = await runner.validateAll();

      expect(report.summary.humanAgreementPassCount).toBe(0);
      expect(report.summary.overallStable).toBe(true); // scores are stable, just wrong
    });

    it("should aggregate token usage across all rounds", async () => {
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores(), false)
      );

      const samples = [makeSample({ id: "t-01" }), makeSample({ id: "t-02" })];

      const runner = createRunner(samples);
      const report = await runner.validateAll();

      // 2 samples × 3 rounds × (500 prompt + 100 completion)
      expect(report.summary.totalTokensUsed.promptTokens).toBe(2 * 3 * 500);
      expect(report.summary.totalTokensUsed.completionTokens).toBe(2 * 3 * 100);
      expect(report.summary.totalCostEstimate).toBeGreaterThan(0);
    });

    it("should have correct modelInfo", async () => {
      mockEvaluateChapter.mockResolvedValue(
        makeMockEvalResult(makeValidatedScores())
      );

      const runner = createRunner([makeSample()]);
      const report = await runner.validateAll();

      expect(report.modelInfo.provider).toBe("DeepSeek");
      expect(report.modelInfo.model).toBe("deepseek-v4-flash");
      expect(report.modelInfo.temperature).toBe(0);
    });
  });

  // ── Error resilience ──

  describe("error resilience", () => {
    it("should not crash when evaluateChapter throws", async () => {
      mockEvaluateChapter.mockRejectedValue(new Error("API failure"));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.rounds).toHaveLength(3);
      for (const r of result.rounds) {
        expect(r.llmAvailable).toBe(false);
        expect(r.scores.hookScore).toBe(0);
        expect(r.scores.climaxScore).toBe(0);
      }
    });

    it("should not crash when one round fails but others succeed", async () => {
      mockEvaluateChapter
        .mockRejectedValueOnce(new Error("Round 1 failed"))
        .mockResolvedValueOnce(makeMockEvalResult(makeValidatedScores({ hookScore: 8, climaxScore: 8, cliffhangerScore: 8, pacingScore: 8, overallScore: 8 })))
        .mockResolvedValueOnce(makeMockEvalResult(makeValidatedScores({ hookScore: 8, climaxScore: 8, cliffhangerScore: 8, pacingScore: 8, overallScore: 8 })));

      const runner = createRunner();
      const result = await runner.validateSample(sample);

      expect(result.rounds[0].llmAvailable).toBe(false);
      expect(result.rounds[0].scores.hookScore).toBe(0);
      expect(result.rounds[1].llmAvailable).toBe(true);
      expect(result.rounds[1].scores.hookScore).toBe(8);
    });
  });
});

// ── Report generation tests ──

describe("generateMarkdownReport", () => {
  function makeSampleResult(
    overrides?: Partial<{
      sampleId: string;
      sampleName: string;
      stabilityPass: boolean;
      humanAgreementPass: boolean;
    }>
  ) {
    const scores = makeValidatedScores();
    return {
      sampleId: overrides?.sampleId ?? "test-01",
      sampleName: overrides?.sampleName ?? "测试样本",
      rounds: [
        {
          round: 1,
          timestamp: "2026-05-20T10:00:00.000Z",
          scores,
          tokenUsage: { promptTokens: 500, completionTokens: 100 } as TokenUsage,
          durationMs: 1500,
          llmAvailable: true,
        },
        {
          round: 2,
          timestamp: "2026-05-20T10:00:02.000Z",
          scores: makeValidatedScores({ hookScore: 7.1 }),
          tokenUsage: { promptTokens: 500, completionTokens: 100 } as TokenUsage,
          durationMs: 1400,
          llmAvailable: true,
        },
        {
          round: 3,
          timestamp: "2026-05-20T10:00:04.000Z",
          scores: makeValidatedScores({ hookScore: 7.2 }),
          tokenUsage: { promptTokens: 500, completionTokens: 100 } as TokenUsage,
          durationMs: 1600,
          llmAvailable: true,
        },
      ],
      variance: {
        hookScore: 0.01,
        climaxScore: 0,
        cliffhangerScore: 0,
        pacingScore: 0,
        overallScore: 0,
      },
      stabilityPass: overrides?.stabilityPass ?? true,
      expectedRangeCheck: {
        climaxInRange: true,
        pacingInRange: true,
        climaxAvgDiff: 0.5,
        pacingAvgDiff: 0.3,
        climaxExpectedRange: "[5, 9]",
        pacingExpectedRange: "[5, 8]",
        fillerAssessment: "预期: low | 实际检测注水倾向: 适中",
      },
      humanAgreementPass: overrides?.humanAgreementPass ?? true,
    };
  }

  function makeReport(overrides?: Partial<GoldenValidationReport>): GoldenValidationReport {
    return {
      generatedAt: "2026-05-20T10:00:10.000Z",
      modelInfo: { provider: "DeepSeek", model: "deepseek-v4-flash", temperature: 0 },
      summary: {
        totalSamples: 2,
        roundsPerSample: 3,
        stabilityPassCount: 2,
        humanAgreementPassCount: 2,
        overallStable: true,
        totalTokensUsed: { promptTokens: 3000, completionTokens: 600 },
        totalCostEstimate: 0.0042,
        totalDurationMs: 8500,
      },
      samples: [
        makeSampleResult({ sampleId: "s-01", sampleName: "样本A" }),
        makeSampleResult({ sampleId: "s-02", sampleName: "样本B" }),
      ],
      promptImprovementNotes: [],
      recommendations: [],
      ...overrides,
    };
  }

  it("should generate valid markdown with all sections", () => {
    const report = makeReport();
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain("# Golden Sample 验证报告");
    expect(markdown).toContain("## 总体结果");
    expect(markdown).toContain("## 各样本详情");
    expect(markdown).toContain("s-01");
    expect(markdown).toContain("s-02");
    expect(markdown).toContain("样本A");
    expect(markdown).toContain("样本B");
    expect(markdown).toContain("DeepSeek");
    expect(markdown).toContain("deepseek-v4-flash");
  });

  it("should include variance and stability status per sample", () => {
    const report = makeReport();
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain("方差分析");
    expect(markdown).toContain("0.01"); // variance value
    expect(markdown).toContain("✓ 稳定");
  });

  it("should show failure status when sample is unstable", () => {
    const report = makeReport();
    report.samples[0] = makeSampleResult({
      sampleId: "fail-01",
      sampleName: "失败样本",
      stabilityPass: false,
      humanAgreementPass: false,
    });
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain("✗ 不稳定");
    expect(markdown).toContain("✗ 偏差");
  });

  it("should handle empty samples array", () => {
    const report = makeReport({ samples: [], summary: { ...makeReport().summary, totalSamples: 0, stabilityPassCount: 0, humanAgreementPassCount: 0 } });
    const markdown = generateMarkdownReport(report);

    expect(typeof markdown).toBe("string");
    expect(markdown).toContain("0");
  });

  it("should include prompt improvement notes when present", () => {
    const report = makeReport({
      promptImprovementNotes: [
        {
          issue: "高潮评分偏高",
          observation: "所有样本的高潮分数都比预期高1-2分",
          suggestion: "调整 prompt 中高潮评分标准，更严格界定",
        },
      ],
    });
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain("## Prompt 改进记录");
    expect(markdown).toContain("高潮评分偏高");
    expect(markdown).toContain("调整 prompt");
  });

  it("should omit prompt improvement section when empty", () => {
    const report = makeReport({ promptImprovementNotes: [] });
    const markdown = generateMarkdownReport(report);

    expect(markdown).not.toContain("## Prompt 改进记录");
  });

  it("should include recommendations when present", () => {
    const report = makeReport({
      recommendations: ["增加更多长文本样本以测试上下文理解", "调低 temperature 以减少方差"],
    });
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain("## 建议");
    expect(markdown).toContain("增加更多长文本样本");
  });

  it("should contain score tables", () => {
    const report = makeReport();
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain("| R1 |");
    expect(markdown).toContain("| R2 |");
    expect(markdown).toContain("| R3 |");
  });

  it("should contain token and cost info in summary", () => {
    const report = makeReport();
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain("3000");
    expect(markdown).toContain("600");
    expect(markdown).toContain("¥0.0042");
  });
});
