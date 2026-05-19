import type { ClimaxResult } from "../climax";
import type { PacingResult } from "../pacing";
import type { FillerResult } from "../filler";
import type { LLMResult } from "../llm";
import { guardScores, type ValidatedScores } from "../guard";

export interface EvaluationResult {
  climaxResult: ClimaxResult;
  pacingResult: PacingResult;
  fillerResult: FillerResult;
  llmResult: LLMResult | null;
  scores: ValidatedScores;
  isPartial: boolean;
}

export interface PipelineDependencies {
  analyzeClimax: (text: string) => ClimaxResult;
  analyzePacing: (text: string) => PacingResult;
  detectFiller: (text: string) => FillerResult;
  evaluateWithLLM: (text: string, prompt: string) => Promise<LLMResult>;
}

export interface EvaluationPipeline {
  evaluateChapter(text: string): Promise<EvaluationResult>;
}

const DEFAULT_PROMPT = "请评估以下章节的Hook强度、章末悬念和一致性问题。";

export function createEvaluationPipeline(deps: PipelineDependencies): EvaluationPipeline {
  return {
    async evaluateChapter(text: string): Promise<EvaluationResult> {
      // 并行执行规则引擎和 LLM
      const ruleEnginePromise = Promise.resolve().then(() => ({
        climax: deps.analyzeClimax(text),
        pacing: deps.analyzePacing(text),
        filler: deps.detectFiller(text),
      }));

      const llmPromise = deps.evaluateWithLLM(text, DEFAULT_PROMPT).catch(() => null);

      const [ruleResults, llmResult] = await Promise.all([
        ruleEnginePromise,
        llmPromise,
      ]);

      const isPartial = llmResult === null;

      // 构建分数
      const rawScores = {
        hookScore: llmResult?.hookScore ?? 0,
        climaxScore: ruleResults.climax.score,
        cliffhangerScore: llmResult?.cliffhangerScore ?? 0,
        pacingScore: ruleResults.pacing.score,
      };

      const scores = guardScores(rawScores);

      return {
        climaxResult: ruleResults.climax,
        pacingResult: ruleResults.pacing,
        fillerResult: ruleResults.filler,
        llmResult,
        scores,
        isPartial,
      };
    },
  };
}
