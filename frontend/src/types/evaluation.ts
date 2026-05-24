// ── Dimension scores ──

export interface DimensionScores {
  hookScore: number;
  climaxScore: number;
  cliffhangerScore: number;
  pacingScore: number;
}

export interface DualModelScores {
  deepseek: DimensionScores;
  doubao: DimensionScores;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface DualTokenUsage {
  deepseek: TokenUsage;
  doubao: TokenUsage;
}

export interface DivergenceItem {
  dimension: string;
  deepseek: number;
  doubao: number;
  delta: number;
}

// ── Feature types (mirrors backend service types) ──

export interface ClimaxFeatures {
  matchedKeywords: string[];
  keywordCategories: Record<string, string[]>;
  dialogueDensity: number;
  conflictDensity: number;
}

export interface PacingFeatures {
  curve: { paragraph: number; tension: number; type: string }[];
  cv: number;
  typeRatio: { action: number; dialogue: number; description: number };
}

export interface FillerFeatures {
  items: { paragraph: number; reason: string; suggestion: string }[];
  suspiciousPairs: { paragraphA: number; paragraphB: number; similarity: number }[];
  truncated: boolean;
}

export interface HookFeatures {
  openingType: string;
  hasQuestion: boolean;
  hasGoldenLine: boolean;
  conflictHitCount: number;
  suspenseHitCount: number;
}

export interface CliffhangerFeatures {
  endingType: string;
  hasQuestion: boolean;
  hasReversalHint: boolean;
  suspenseHitCount: number;
}

export interface AllFeatures {
  climax: ClimaxFeatures;
  pacing: PacingFeatures;
  filler: FillerFeatures;
  hook: HookFeatures;
  cliffhanger: CliffhangerFeatures;
}

// ── Qualitative ──

export interface SuggestionItem {
  severity: "critical" | "warning" | "info";
  location: string;
  issue: string;
  direction: string;
}

export interface ModelQualitative {
  highlights: string[];
  suggestions: SuggestionItem[];
  consistencyIssues: string[];
}

// ── Discriminated union result (matches backend EvaluationResultV2) ──

export type EvaluationResultV2 =
  | {
      status: "complete";
      scores: DualModelScores;
      features: AllFeatures;
      tokenUsage: DualTokenUsage;
      divergence?: DivergenceItem[];
      deepseek: ModelQualitative;
      doubao: ModelQualitative;
    }
  | {
      status: "partial";
      scores: DimensionScores;
      features: AllFeatures;
      failedModel: string;
      failedModelLabel: string;
      tokenUsage: TokenUsage;
    }
  | {
      status: "degraded";
      report: string;
      features: AllFeatures;
      reason: string;
    };
