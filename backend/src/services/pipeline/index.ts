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

export interface ProgressEvent {
  step: number;
  stepName: string;
}

export interface PipelineOptions {
  onProgress?: (event: ProgressEvent) => void;
}

export interface PipelineDependencies {
  analyzeClimax: (text: string) => ClimaxResult;
  analyzePacing: (text: string) => PacingResult;
  detectFiller: (text: string) => FillerResult;
  evaluateWithLLM: (text: string, prompt: string) => Promise<LLMResult>;
}

export interface EvaluationPipeline {
  evaluateChapter(text: string, options?: PipelineOptions): Promise<EvaluationResult>;
}

export function createEvaluationPipeline(
  deps: PipelineDependencies,
  options?: PipelineOptions
): EvaluationPipeline {
  return {
    async evaluateChapter(
      text: string,
      callOptions?: PipelineOptions
    ): Promise<EvaluationResult> {
      const notify = callOptions?.onProgress ?? options?.onProgress;

      // 步骤 2：分析爽点密度
      notify?.({ step: 2, stepName: "分析爽点密度" });
      const climaxResult = deps.analyzeClimax(text);

      // 步骤 3：分析节奏
      notify?.({ step: 3, stepName: "分析节奏" });
      const pacingResult = deps.analyzePacing(text);
      const fillerResult = deps.detectFiller(text);

      // 阶段 2：将信号注入 LLM prompt
      const signals: SignalData = {
        climax: climaxResult,
        pacing: pacingResult,
        filler: fillerResult,
      };
      const prompt = buildEvaluationPrompt(signals);

      // 步骤 4-5：LLM 评估阶段
      notify?.({ step: 4, stepName: "评估Hook强度" });
      notify?.({ step: 5, stepName: "评估章末悬念" });

      // 阶段 3：调用 LLM 进行评估
      const llmResult = await deps.evaluateWithLLM(text, prompt).catch(() => null);

      // 步骤 6：检查一致性
      notify?.({ step: 6, stepName: "检查一致性" });

      const isPartial = llmResult === null;

      // 阶段 4：构建分数 — LLM 分数为主，规则引擎分数为降级方案
      const rawScores = {
        hookScore: llmResult?.hookScore ?? 0,
        climaxScore: llmResult?.climaxScore ?? climaxResult.score,
        cliffhangerScore: llmResult?.cliffhangerScore ?? 0,
        pacingScore: llmResult?.pacingScore ?? pacingResult.score,
      };

      const scores = guardScores(rawScores);

      // 步骤 7：生成报告
      notify?.({ step: 7, stepName: "生成报告" });

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
