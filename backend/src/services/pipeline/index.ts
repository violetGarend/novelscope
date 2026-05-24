import type { ClimaxFeatures } from "../climax";
import type { PacingFeatures } from "../pacing";
import type { FillerFeatures } from "../filler";
import type { HookFeatures } from "../hook";
import type { CliffhangerFeatures } from "../cliffhanger";
import type { LLMResult } from "../llm";
import type { LLMCallResult, TokenUsage } from "../llm/client";
import { guardScores, type ValidatedScores } from "../guard";
import { buildEvaluationPrompt, type SignalData } from "../prompt";

export interface EvaluationResult {
  climaxResult: ClimaxFeatures;
  pacingResult: PacingFeatures;
  fillerResult: FillerFeatures;
  hookResult: HookFeatures | null;
  cliffhangerResult: CliffhangerFeatures | null;
  llmResult: LLMResult | null;
  scores: ValidatedScores;
  isPartial: boolean;
  tokenUsage: TokenUsage | null;
  hookSource: "llm" | "rule";
  cliffhangerSource: "llm" | "rule";
}

export interface ProgressEvent {
  step: number;
  stepName: string;
}

export interface PipelineOptions {
  onProgress?: (event: ProgressEvent) => void;
}

export interface PipelineDependencies {
  analyzeClimax: (text: string) => ClimaxFeatures;
  analyzePacing: (text: string) => PacingFeatures;
  detectFiller: (text: string) => FillerFeatures;
  analyzeHook: (text: string) => HookFeatures;
  analyzeCliffhanger: (text: string) => CliffhangerFeatures;
  evaluateWithLLM: (text: string, prompt: string) => Promise<LLMCallResult>;
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

      // 步骤 3：分析节奏 + Hook + Cliffhanger
      notify?.({ step: 3, stepName: "分析节奏" });
      const pacingResult = deps.analyzePacing(text);
      const fillerResult = deps.detectFiller(text);
      const hookResult = deps.analyzeHook(text);
      const cliffhangerResult = deps.analyzeCliffhanger(text);

      // 阶段 2：将信号注入 LLM prompt
      const signals: SignalData = {
        climax: climaxResult,
        pacing: pacingResult,
        filler: fillerResult,
        hook: hookResult,
        cliffhanger: cliffhangerResult,
      };
      const promptResult = buildEvaluationPrompt(signals);
      const prompt = promptResult.prompt;

      // 步骤 4：构建 AI 提示
      notify?.({ step: 4, stepName: "构建 AI 提示…" });

      // 步骤 5：调用 AI 分析（LLM 调用期间显示此步骤）
      notify?.({ step: 5, stepName: "调用 AI 分析…" });

      // 阶段 3：调用 LLM 进行评估
      const llmCallResult = await deps.evaluateWithLLM(text, prompt).catch(() => null);

      // 步骤 6：处理 AI 结果 + 一致性校验
      notify?.({ step: 6, stepName: "处理 AI 结果…" });

      const isPartial = llmCallResult === null;
      const llmResult = llmCallResult?.result ?? null;

      // 阶段 4：构建分数 — LLM 分数为主，规则引擎分数为降级方案
      const hookSource: "llm" | "rule" = llmResult?.hookScore != null ? "llm" : "rule";
      const cliffhangerSource: "llm" | "rule" = llmResult?.cliffhangerScore != null ? "llm" : "rule";

      // Fallback to 0 when rule engines are feature-only (no scores)
      const rawScores = {
        hookScore: llmResult?.hookScore ?? 0,
        climaxScore: llmResult?.climaxScore ?? 0,
        cliffhangerScore: llmResult?.cliffhangerScore ?? 0,
        pacingScore: llmResult?.pacingScore ?? 0,
      };

      const scores = guardScores(rawScores);

      // 步骤 7：生成报告
      notify?.({ step: 7, stepName: "生成报告" });

      return {
        climaxResult,
        pacingResult,
        fillerResult,
        hookResult,
        cliffhangerResult,
        llmResult,
        scores,
        isPartial,
        tokenUsage: llmCallResult?.usage ?? null,
        hookSource,
        cliffhangerSource,
      };
    },
  };
}
