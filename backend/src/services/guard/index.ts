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
  isWithinBudget: number;
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
