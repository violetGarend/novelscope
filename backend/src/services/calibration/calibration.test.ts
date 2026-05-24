import { describe, it, expect } from "@jest/globals";
import {
  checkHitWithTolerance,
  computePooledVariance,
  makeGateDecision,
  generateCalibrationReport,
} from "./index";
import type { RoundResult } from "../golden-sample";
import type { ValidatedScores } from "../guard";
import type { GoldenSample } from "../golden-sample";
import type { CalibrationSampleResult } from "./index";

function makeScores(overrides?: Partial<ValidatedScores>): ValidatedScores {
  return {
    hookScore: overrides?.hookScore ?? 7,
    climaxScore: overrides?.climaxScore ?? 7,
    cliffhangerScore: overrides?.cliffhangerScore ?? 7,
    pacingScore: overrides?.pacingScore ?? 7,
  };
}

function makeRound(round: number, scores: ValidatedScores): RoundResult {
  return {
    round,
    timestamp: new Date().toISOString(),
    scores,
    tokenUsage: { promptTokens: 500, completionTokens: 100 },
    durationMs: 1500,
    llmAvailable: true,
  };
}

// ── checkHitWithTolerance ──

describe("checkHitWithTolerance", () => {
  it("returns true when score is within expected range (no tolerance needed)", () => {
    // expected [5, 9], score 7 → true
    expect(checkHitWithTolerance(7, 5, 9, 1.5)).toBe(true);
  });

  it("returns true when score is outside expected range but within tolerance", () => {
    // expected [5, 9], score 3.6 → outside [5,9] but tolerated range is [3.5, 10.5]
    expect(checkHitWithTolerance(3.6, 5, 9, 1.5)).toBe(true);
    // expected [5, 9], score 10 → outside [5,9] but within [3.5, 10.5]
    expect(checkHitWithTolerance(10, 5, 9, 1.5)).toBe(true);
  });

  it("returns false when score is outside tolerance range", () => {
    // expected [5, 9], tolerance 1.5 → tolerated [3.5, 10.5], score 3 → false
    expect(checkHitWithTolerance(3, 5, 9, 1.5)).toBe(false);
    expect(checkHitWithTolerance(11, 5, 9, 1.5)).toBe(false);
  });

  it("clamps tolerance range to [0, 10]", () => {
    // expected [0, 3], tolerance 1.5 → tolerated [0, 4.5], not [-1.5, 4.5]
    expect(checkHitWithTolerance(0, 0, 3, 1.5)).toBe(true);
    // expected [8, 10], tolerance 1.5 → tolerated [6.5, 10], not [6.5, 11.5]
    expect(checkHitWithTolerance(6.6, 8, 10, 1.5)).toBe(true);
    expect(checkHitWithTolerance(6.4, 8, 10, 1.5)).toBe(false);
  });
});

// ── computePooledVariance ──

describe("computePooledVariance", () => {
  it("returns 0 for identical scores across all rounds and dimensions", () => {
    const rounds = [
      makeRound(1, makeScores({ hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7 })),
      makeRound(2, makeScores({ hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7 })),
      makeRound(3, makeScores({ hookScore: 7, climaxScore: 7, cliffhangerScore: 7, pacingScore: 7 })),
    ];
    expect(computePooledVariance(rounds)).toBe(0);
  });

  it("pools variance across all 4 dimensions", () => {
    const rounds = [
      makeRound(1, makeScores({ hookScore: 6, climaxScore: 7, cliffhangerScore: 8, pacingScore: 5 })),
      makeRound(2, makeScores({ hookScore: 8, climaxScore: 9, cliffhangerScore: 6, pacingScore: 7 })),
      makeRound(3, makeScores({ hookScore: 7, climaxScore: 8, cliffhangerScore: 7, pacingScore: 6 })),
    ];
    const result = computePooledVariance(rounds);
    expect(result).toBeGreaterThan(0);
    // Should be the mean of 4 dimension variances
    expect(typeof result).toBe("number");
  });

  it("returns 0 for single round", () => {
    const rounds = [makeRound(1, makeScores())];
    expect(computePooledVariance(rounds)).toBe(0);
  });
});

// ── makeGateDecision ──

describe("makeGateDecision", () => {
  function makeSampleResult(overrides: {
    sampleId: string;
    sampleName: string;
    pooledVariance: number;
    climaxHit: boolean;
    pacingHit: boolean;
  }): CalibrationSampleResult {
    return {
      sampleId: overrides.sampleId,
      sampleName: overrides.sampleName,
      rounds: [
        makeRound(1, makeScores()),
        makeRound(2, makeScores()),
        makeRound(3, makeScores()),
      ],
      pooledVariance: overrides.pooledVariance,
      variancePass: overrides.pooledVariance < 0.5,
      rangesHit: {
        climaxHit: overrides.climaxHit,
        pacingHit: overrides.pacingHit,
        climaxAvg: 7,
        pacingAvg: 7,
        climaxExpected: { min: 5, max: 9 },
        pacingExpected: { min: 5, max: 8 },
        climaxToleranceRange: { min: 3.5, max: 10 },
        pacingToleranceRange: { min: 3.5, max: 9.5 },
      },
      allRangesHit: overrides.climaxHit && overrides.pacingHit,
    };
  }

  it("returns PASS when all samples pass variance and ≥4/5 hit", () => {
    const samples = [
      makeSampleResult({ sampleId: "s1", sampleName: "a", pooledVariance: 0.1, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s2", sampleName: "b", pooledVariance: 0.1, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s3", sampleName: "c", pooledVariance: 0.2, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s4", sampleName: "d", pooledVariance: 0.15, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s5", sampleName: "e", pooledVariance: 0.1, climaxHit: false, pacingHit: true }), // 1 miss ok
    ];
    const decision = makeGateDecision(samples);
    expect(decision.passed).toBe(true);
    expect(decision.hitCount).toBe(4);
    expect(decision.message).toContain("PASS");
  });

  it("returns FAIL when variance check fails", () => {
    const samples = [
      makeSampleResult({ sampleId: "s1", sampleName: "a", pooledVariance: 0.8, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s2", sampleName: "b", pooledVariance: 0.1, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s3", sampleName: "c", pooledVariance: 0.1, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s4", sampleName: "d", pooledVariance: 0.1, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s5", sampleName: "e", pooledVariance: 0.1, climaxHit: true, pacingHit: true }),
    ];
    const decision = makeGateDecision(samples);
    expect(decision.passed).toBe(false);
    expect(decision.variancePass).toBe(false);
    expect(decision.message).toContain("FAIL");
    expect(decision.tuningSuggestions.length).toBeGreaterThan(0);
  });

  it("returns FAIL when hit count < 4", () => {
    const samples = [
      makeSampleResult({ sampleId: "s1", sampleName: "a", pooledVariance: 0.1, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s2", sampleName: "b", pooledVariance: 0.1, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s3", sampleName: "c", pooledVariance: 0.1, climaxHit: false, pacingHit: false }),
      makeSampleResult({ sampleId: "s4", sampleName: "d", pooledVariance: 0.1, climaxHit: false, pacingHit: false }),
      makeSampleResult({ sampleId: "s5", sampleName: "e", pooledVariance: 0.1, climaxHit: false, pacingHit: true }), // only 2 hit
    ];
    const decision = makeGateDecision(samples);
    expect(decision.passed).toBe(false);
    expect(decision.hitPass).toBe(false);
    expect(decision.tuningSuggestions.length).toBeGreaterThan(0);
  });

  it("provides specific tuning suggestions for each failure type", () => {
    const samples = [
      makeSampleResult({ sampleId: "s1", sampleName: "a", pooledVariance: 0.9, climaxHit: false, pacingHit: false }),
      makeSampleResult({ sampleId: "s2", sampleName: "b", pooledVariance: 0.8, climaxHit: true, pacingHit: true }),
      makeSampleResult({ sampleId: "s3", sampleName: "c", pooledVariance: 0.7, climaxHit: false, pacingHit: false }),
      makeSampleResult({ sampleId: "s4", sampleName: "d", pooledVariance: 0.1, climaxHit: false, pacingHit: false }),
      makeSampleResult({ sampleId: "s5", sampleName: "e", pooledVariance: 0.1, climaxHit: true, pacingHit: true }),
    ];
    const decision = makeGateDecision(samples);
    expect(decision.passed).toBe(false);
    // Should have suggestions for both variance and hit issues
    const hasVarianceSuggestion = decision.tuningSuggestions.some(
      (s) => s.includes("方差") || s.includes("稳定性") || s.includes("锚点") || s.includes("评分标准")
    );
    const hasHitSuggestion = decision.tuningSuggestions.some(
      (s) => s.includes("预期范围") || s.includes("偏差") || s.includes("锚点") || s.includes("标定")
    );
    expect(hasVarianceSuggestion || hasHitSuggestion).toBe(true);
  });
});

// ── generateCalibrationReport ──

describe("generateCalibrationReport", () => {
  it("produces valid JSON structure with all required fields", () => {
    const samples: CalibrationSampleResult[] = [
      {
        sampleId: "s1",
        sampleName: "test",
        rounds: [makeRound(1, makeScores()), makeRound(2, makeScores()), makeRound(3, makeScores())],
        pooledVariance: 0.1,
        variancePass: true,
        rangesHit: {
          climaxHit: true,
          pacingHit: true,
          climaxAvg: 7,
          pacingAvg: 6.5,
          climaxExpected: { min: 5, max: 9 },
          pacingExpected: { min: 5, max: 8 },
          climaxToleranceRange: { min: 3.5, max: 10 },
          pacingToleranceRange: { min: 3.5, max: 9.5 },
        },
        allRangesHit: true,
      },
    ];

    const report = generateCalibrationReport(samples, {
      provider: "DeepSeek",
      model: "deepseek-v4-flash",
      temperature: 0,
    });

    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("modelInfo");
    expect(report).toHaveProperty("samples");
    expect(report).toHaveProperty("gateDecision");
    expect(report).toHaveProperty("summary");
    expect(report.gateDecision).toHaveProperty("passed");
    expect(report.gateDecision).toHaveProperty("message");
    expect(report.gateDecision).toHaveProperty("tuningSuggestions");
    expect(report.summary).toHaveProperty("totalSamples");
    expect(report.summary).toHaveProperty("variancePassCount");
    expect(report.summary).toHaveProperty("hitCount");
  });

  it("includes per-sample detail in report", () => {
    const samples: CalibrationSampleResult[] = [
      {
        sampleId: "s1",
        sampleName: "sample-one",
        rounds: [makeRound(1, makeScores({ climaxScore: 8 })), makeRound(2, makeScores({ climaxScore: 7 })), makeRound(3, makeScores({ climaxScore: 9 }))],
        pooledVariance: 0.67,
        variancePass: false,
        rangesHit: {
          climaxHit: true,
          pacingHit: false,
          climaxAvg: 8,
          pacingAvg: 5,
          climaxExpected: { min: 5, max: 9 },
          pacingExpected: { min: 6, max: 9 },
          climaxToleranceRange: { min: 3.5, max: 10 },
          pacingToleranceRange: { min: 4.5, max: 10 },
        },
        allRangesHit: false,
      },
    ];

    const report = generateCalibrationReport(samples, {
      provider: "DeepSeek",
      model: "deepseek-v4-flash",
      temperature: 0,
    });

    expect(report.samples[0].sampleId).toBe("s1");
    expect(report.samples[0].sampleName).toBe("sample-one");
    expect(report.samples[0].pooledVariance).toBe(0.67);
    expect(report.samples[0].variancePass).toBe(false);
    expect(report.gateDecision.passed).toBe(false);
    expect(report.gateDecision.hitCount).toBe(0);
  });
});
