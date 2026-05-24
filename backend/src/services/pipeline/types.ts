import type { ClimaxFeatures } from "../climax";
import type { PacingFeatures } from "../pacing";
import type { FillerFeatures } from "../filler";
import type { HookFeatures } from "../hook";
import type { CliffhangerFeatures } from "../cliffhanger";
import type { TokenUsage, LLMCallResult } from "../llm/client";
import type { SuggestionItem } from "../llm/schema";

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

export type DivergenceReport = DivergenceItem[];

// ── All features ──

export interface AllFeatures {
  climax: ClimaxFeatures;
  pacing: PacingFeatures;
  filler: FillerFeatures;
  hook: HookFeatures;
  cliffhanger: CliffhangerFeatures;
}

// ── Discriminated union result ──

export interface ModelQualitative {
  highlights: string[];
  suggestions: SuggestionItem[];
  consistencyIssues: string[];
}

export type EvaluationResultV2 =
  | {
      status: "complete";
      scores: DualModelScores;
      features: AllFeatures;
      tokenUsage: DualTokenUsage;
      divergence?: DivergenceReport;
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

// ── Pipeline dependencies ──

export interface ProgressEvent {
  step: number;
  stepName: string;
}

export interface PipelineOptions {
  onProgress?: (event: ProgressEvent) => void;
}

export interface DualModelDependencies {
  analyzeClimax: (text: string) => ClimaxFeatures;
  analyzePacing: (text: string) => PacingFeatures;
  detectFiller: (text: string) => FillerFeatures;
  analyzeHook: (text: string) => HookFeatures;
  analyzeCliffhanger: (text: string) => CliffhangerFeatures;
  evaluateModelA: (text: string, prompt: string) => Promise<LLMCallResult>;
  evaluateModelB: (text: string, prompt: string) => Promise<LLMCallResult>;
}

export interface DualModelPipeline {
  evaluateChapter(text: string, options?: PipelineOptions): Promise<EvaluationResultV2>;
}
