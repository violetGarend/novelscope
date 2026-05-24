import type { RoundResult, GoldenValidationReport } from "../golden-sample";
import type { ValidatedScores } from "../guard";

// ── Calibration-specific types ──

export interface ToleranceRange {
  min: number;
  max: number;
}

export interface CalibrationRangesHit {
  climaxHit: boolean;
  pacingHit: boolean;
  climaxAvg: number;
  pacingAvg: number;
  climaxExpected: { min: number; max: number };
  pacingExpected: { min: number; max: number };
  climaxToleranceRange: ToleranceRange;
  pacingToleranceRange: ToleranceRange;
}

export interface CalibrationSampleResult {
  sampleId: string;
  sampleName: string;
  rounds: RoundResult[];
  pooledVariance: number;
  variancePass: boolean;
  rangesHit: CalibrationRangesHit;
  allRangesHit: boolean;
}

export interface GateDecision {
  passed: boolean;
  variancePass: boolean;
  hitPass: boolean;
  stabilityCount: number;
  hitCount: number;
  totalSamples: number;
  message: string;
  tuningSuggestions: string[];
}

export interface CalibrationReport {
  generatedAt: string;
  modelInfo: {
    provider: string;
    model: string;
    temperature: number;
  };
  samples: CalibrationSampleResult[];
  gateDecision: GateDecision;
  summary: {
    totalSamples: number;
    variancePassCount: number;
    hitCount: number;
    totalRounds: number;
  };
}

// ── Tolerance-based hit check ──

const DEFAULT_TOLERANCE = 1.5;

export function checkHitWithTolerance(
  avgScore: number,
  expectedMin: number,
  expectedMax: number,
  tolerance: number = DEFAULT_TOLERANCE
): boolean {
  const lower = Math.max(0, expectedMin - tolerance);
  const upper = Math.min(10, expectedMax + tolerance);
  return avgScore >= lower && avgScore <= upper;
}

export function computeToleranceRange(
  expectedMin: number,
  expectedMax: number,
  tolerance: number = DEFAULT_TOLERANCE
): ToleranceRange {
  return {
    min: Math.max(0, expectedMin - tolerance),
    max: Math.min(10, expectedMax + tolerance),
  };
}

// ── Pooled variance across all 4 dimensions ──

function dimensionVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

export function computePooledVariance(rounds: RoundResult[]): number {
  if (rounds.length < 2) return 0;

  const hookScores = rounds.map((r) => r.scores.hookScore);
  const climaxScores = rounds.map((r) => r.scores.climaxScore);
  const cliffhangerScores = rounds.map((r) => r.scores.cliffhangerScore);
  const pacingScores = rounds.map((r) => r.scores.pacingScore);

  const variances = [
    dimensionVariance(hookScores),
    dimensionVariance(climaxScores),
    dimensionVariance(cliffhangerScores),
    dimensionVariance(pacingScores),
  ];

  return Math.round((variances.reduce((a, b) => a + b, 0) / variances.length) * 100) / 100;
}

// ── Average helper ──

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ── Build calibration sample result ──

export function buildCalibrationResult(
  sampleId: string,
  sampleName: string,
  rounds: RoundResult[],
  expectedRanges: { climaxScore: { min: number; max: number }; pacingScore: { min: number; max: number } },
  tolerance: number = DEFAULT_TOLERANCE
): CalibrationSampleResult {
  const pooledVariance = computePooledVariance(rounds);
  const climaxAvg = Math.round(average(rounds.map((r) => r.scores.climaxScore)) * 100) / 100;
  const pacingAvg = Math.round(average(rounds.map((r) => r.scores.pacingScore)) * 100) / 100;

  const climaxHit = checkHitWithTolerance(climaxAvg, expectedRanges.climaxScore.min, expectedRanges.climaxScore.max, tolerance);
  const pacingHit = checkHitWithTolerance(pacingAvg, expectedRanges.pacingScore.min, expectedRanges.pacingScore.max, tolerance);

  return {
    sampleId,
    sampleName,
    rounds,
    pooledVariance,
    variancePass: pooledVariance < 0.5,
    rangesHit: {
      climaxHit,
      pacingHit,
      climaxAvg,
      pacingAvg,
      climaxExpected: expectedRanges.climaxScore,
      pacingExpected: expectedRanges.pacingScore,
      climaxToleranceRange: computeToleranceRange(expectedRanges.climaxScore.min, expectedRanges.climaxScore.max, tolerance),
      pacingToleranceRange: computeToleranceRange(expectedRanges.pacingScore.min, expectedRanges.pacingScore.max, tolerance),
    },
    allRangesHit: climaxHit && pacingHit,
  };
}

// ── GATE decision ──

const HIT_THRESHOLD = 4; // ≥ 4/5 samples must hit

export function makeGateDecision(samples: CalibrationSampleResult[]): GateDecision {
  const totalSamples = samples.length;
  const variancePassCount = samples.filter((s) => s.variancePass).length;
  const hitCount = samples.filter((s) => s.allRangesHit).length;

  const variancePass = variancePassCount === totalSamples;
  const hitPass = hitCount >= HIT_THRESHOLD;
  const passed = variancePass && hitPass;

  const tuningSuggestions: string[] = [];

  if (!variancePass) {
    const failedSamples = samples.filter((s) => !s.variancePass);
    const ids = failedSamples.map((s) => s.sampleId).join(", ");
    tuningSuggestions.push(
      `方差超标: ${failedSamples.length}/${totalSamples} 个样本池化方差 ≥ 0.5 (${ids})。建议调优 Prompt v2 锚点评分标准，增加具体示例以减少 LLM 评分波动。`
    );
  }

  if (!hitPass) {
    const missedSamples = samples.filter((s) => !s.allRangesHit);
    const ids = missedSamples.map((s) => s.sampleId).join(", ");
    tuningSuggestions.push(
      `命中不足: 仅 ${hitCount}/${totalSamples} 个样本命中预期范围 (≥${HIT_THRESHOLD} 才通过)。未命中样本: ${ids}。建议调整对应样本的锚点措辞或重新标定 ExpectedRanges。`
    );
  }

  let message: string;
  if (passed) {
    message = "PASS — 校准通过，Prompt v2 评分方差充足且与人工预期一致。可以启动 p1-006 双模型编排。";
  } else {
    const reasons = [];
    if (!variancePass) reasons.push("方差超标");
    if (!hitPass) reasons.push("命中不足");
    message = `FAIL — 校准未通过 (${reasons.join(" + ")})。需调优 Prompt v2 锚点/措辞后重新校准。`;
  }

  return {
    passed,
    variancePass,
    hitPass,
    stabilityCount: variancePassCount,
    hitCount,
    totalSamples,
    message,
    tuningSuggestions,
  };
}

// ── Report generation ──

export function generateCalibrationReport(
  samples: CalibrationSampleResult[],
  modelInfo: { provider: string; model: string; temperature: number }
): CalibrationReport {
  const gateDecision = makeGateDecision(samples);

  let totalRounds = 0;
  for (const s of samples) {
    totalRounds += s.rounds.length;
  }

  return {
    generatedAt: new Date().toISOString(),
    modelInfo,
    samples,
    gateDecision,
    summary: {
      totalSamples: samples.length,
      variancePassCount: gateDecision.stabilityCount,
      hitCount: gateDecision.hitCount,
      totalRounds,
    },
  };
}
