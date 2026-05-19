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
  overallScore: number;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(10, score));
}

function calculateOverall(hook: number, climax: number, cliffhanger: number, pacing: number): number {
  const raw = hook * 0.3 + climax * 0.3 + cliffhanger * 0.25 + pacing * 0.15;
  return Math.round(raw * 10) / 10;
}

export function guardScores(raw: RawScores): ValidatedScores {
  const hookScore = clampScore(raw.hookScore);
  const climaxScore = clampScore(raw.climaxScore);
  const cliffhangerScore = clampScore(raw.cliffhangerScore);
  const pacingScore = clampScore(raw.pacingScore);
  const overallScore = calculateOverall(hookScore, climaxScore, cliffhangerScore, pacingScore);

  return {
    hookScore,
    climaxScore,
    cliffhangerScore,
    pacingScore,
    overallScore,
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
