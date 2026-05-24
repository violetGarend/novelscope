import type { DimensionScores, DivergenceReport } from "../pipeline/types";

export interface RawScores {
  hookScore: number;
  climaxScore: number;
  cliffhangerScore: number;
  pacingScore: number;
}

export interface ValidatedScores {
  hookScore: number;
  climaxScore: number;
  cliffhangerScore: number;
  pacingScore: number;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(10, score));
}

export function guardScores(raw: RawScores): ValidatedScores {
  return {
    hookScore: clampScore(raw.hookScore),
    climaxScore: clampScore(raw.climaxScore),
    cliffhangerScore: clampScore(raw.cliffhangerScore),
    pacingScore: clampScore(raw.pacingScore),
  };
}

export interface VarianceResult {
  variance: number;
  isWithinBudget: boolean;
}

const VARIANCE_THRESHOLD = 0.5;

export function checkVariance(scores: number[]): VarianceResult {
  if (scores.length < 2) {
    return { variance: 0, isWithinBudget: true };
  }

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;

  return {
    variance: Math.round(variance * 100) / 100,
    isWithinBudget: variance < VARIANCE_THRESHOLD,
  };
}

// ── Divergence detection (independent of clamp/variance) ──

const DIVERGENCE_THRESHOLD = 2;

const DIVERGENCE_DIMENSIONS: Array<{ key: keyof DimensionScores }> = [
  { key: "hookScore" },
  { key: "climaxScore" },
  { key: "cliffhangerScore" },
  { key: "pacingScore" },
];

export function detectDivergence(a: DimensionScores, b: DimensionScores): DivergenceReport {
  const report: DivergenceReport = [];
  for (const { key } of DIVERGENCE_DIMENSIONS) {
    const va = a[key];
    const vb = b[key];
    const delta = Math.round(Math.abs(va - vb) * 10) / 10;
    if (delta > DIVERGENCE_THRESHOLD) {
      report.push({
        dimension: key,
        deepseek: va,
        doubao: vb,
        delta,
      });
      console.warn(`[Divergence] ${key}: DeepSeek=${va}, Doubao=${vb}, delta=${delta}`);
    }
  }
  return report;
}
