import type { ClimaxResult } from "../climax";
import type { PacingResult } from "../pacing";
import type { FillerResult } from "../filler";
import type { LLMResult } from "../llm";
import { guardScores, type ValidatedScores } from "../guard";
import { buildEvaluationPrompt, type SignalData } from "../prompt";

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

export function createEvaluationPipeline(deps: PipelineDependencies): EvaluationPipeline {
  return {
    async evaluateChapter(text: string): Promise<EvaluationResult> {
      // 阶段 1：运行规则引擎，提取结构化信号
      const climaxResult = deps.analyzeClimax(text);
      const pacingResult = deps.analyzePacing(text);
      const fillerResult = deps.detectFiller(text);

      // 阶段 2：将信号注入 LLM prompt
      const signals: SignalData = {
        climax: climaxResult,
        pacing: pacingResult,
        filler: fillerResult,
      };
      const prompt = buildEvaluationPrompt(signals);

      // 阶段 3：调用 LLM 进行评估
      const llmResult = await deps.evaluateWithLLM(text, prompt).catch(() => null);

      const isPartial = llmResult === null;

      // 阶段 4：构建分数 — LLM 分数为主，规则引擎分数为降级方案
      const rawScores = {
        hookScore: llmResult?.hookScore ?? 0,
        climaxScore: llmResult?.climaxScore ?? climaxResult.score,
        cliffhangerScore: llmResult?.cliffhangerScore ?? 0,
        pacingScore: llmResult?.pacingScore ?? pacingResult.score,
      };

      const scores = guardScores(rawScores);

      return {
        climaxResult,
        pacingResult,
        fillerResult,
        llmResult,
        scores,
        isPartial,
      };
    },
  };
}
