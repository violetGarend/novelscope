import type {
  DimensionScores,
  DualModelScores,
  DivergenceReport,
  EvaluationResultV2,
  AllFeatures,
  DualTokenUsage,
  DualModelDependencies,
  DualModelPipeline,
  PipelineOptions,
  ProgressEvent,
} from "./types";
import type { SignalData } from "../prompt";
import { buildEvaluationPrompt } from "../prompt";
import { guardScores, detectDivergence, type ValidatedScores } from "../guard";
import { generateDegradeReport } from "../degrade-report";
import type { LLMCallResult } from "../llm/client";
import type { TokenUsage } from "../llm/client";

// ── Score merging ──

export function pickScores(a: DimensionScores, b: DimensionScores): ValidatedScores {
  const raw: DimensionScores = {
    hookScore: Math.round(((a.hookScore + b.hookScore) / 2) * 10) / 10,
    climaxScore: Math.round(((a.climaxScore + b.climaxScore) / 2) * 10) / 10,
    cliffhangerScore: Math.round(((a.cliffhangerScore + b.cliffhangerScore) / 2) * 10) / 10,
    pacingScore: Math.round(((a.pacingScore + b.pacingScore) / 2) * 10) / 10,
  };
  return guardScores(raw);
}

// ── Dual model orchestrator ──

const MODEL_LABEL_A = "DeepSeek";
const MODEL_LABEL_B = "Doubao";

function buildFeatures(signals: SignalData): AllFeatures {
  return {
    climax: signals.climax,
    pacing: signals.pacing,
    filler: signals.filler,
    hook: signals.hook,
    cliffhanger: signals.cliffhanger,
  };
}

async function evaluateWithTruncationLoop(
  text: string,
  signals: SignalData,
  evaluateModelA: (text: string, prompt: string) => Promise<LLMCallResult>,
  evaluateModelB: (text: string, prompt: string) => Promise<LLMCallResult>,
  maxRounds: number = 1
): Promise<{ resultA: LLMCallResult | null; resultB: LLMCallResult | null }> {
  let promptResult = buildEvaluationPrompt(signals);

  for (let round = 0; round <= maxRounds; round++) {
    const [resultA, resultB] = await Promise.allSettled([
      evaluateModelA(text, promptResult.prompt),
      evaluateModelB(text, promptResult.prompt),
    ]);

    const aOk = resultA.status === "fulfilled" ? resultA.value : null;
    const bOk = resultB.status === "fulfilled" ? resultB.value : null;

    // If both succeeded or this is the last round, return
    const bothSucceeded = aOk !== null && bOk !== null;
    if (bothSucceeded || round >= maxRounds) {
      return { resultA: aOk, resultB: bOk };
    }

    // If truncation is not needed, don't loop
    if (!promptResult.needsTruncation) {
      return { resultA: aOk, resultB: bOk };
    }

    // Truncation needed but at least one model failed — still worth retrying with summarized features
    // For now, collapse oversized feature sections by summarizing
    const fallingBackA = resultA.status === "rejected";
    const fallingBackB = resultB.status === "rejected";

    // Rebuild prompt without truncation-triggering features (strip the features section down)
    // Simple approach: truncate feature text by half
    const truncatedPrompt = promptResult.prompt.replace(
      /<features>[\s\S]*?<\/features>/,
      (_match: string) => {
        // Keep the features tag but indicate truncation
        return "<features>\n[特征因超长已自动截断 — 仅保留关键信号]\n</features>";
      }
    );
    promptResult = { prompt: truncatedPrompt, needsTruncation: false, truncatedFeatures: [...promptResult.truncatedFeatures, "auto-summarized"] };

    // If one model already succeeded, skip re-calling it
    if (aOk && !bOk) {
      return { resultA: aOk, resultB: null };
    }
    if (bOk && !aOk) {
      return { resultA: null, resultB: bOk };
    }
    // Both failed — try again with truncated prompt
  }

  return { resultA: null, resultB: null };
}

export function createDualModelPipeline(
  deps: DualModelDependencies,
  options?: PipelineOptions
): DualModelPipeline {
  return {
    async evaluateChapter(
      text: string,
      callOptions?: PipelineOptions
    ): Promise<EvaluationResultV2> {
      const notify = callOptions?.onProgress ?? options?.onProgress;

      // Step 2-3: Run all rule engines
      notify?.({ step: 2, stepName: "分析爽点密度" });
      const climaxResult = deps.analyzeClimax(text);

      notify?.({ step: 3, stepName: "分析节奏与结构" });
      const pacingResult = deps.analyzePacing(text);
      const fillerResult = deps.detectFiller(text);
      const hookResult = deps.analyzeHook(text);
      const cliffhangerResult = deps.analyzeCliffhanger(text);

      const signals: SignalData = {
        climax: climaxResult,
        pacing: pacingResult,
        filler: fillerResult,
        hook: hookResult,
        cliffhanger: cliffhangerResult,
      };

      // Step 4: Build prompt
      notify?.({ step: 4, stepName: "构建 AI 提示…" });

      // Step 5: Call both models in parallel
      notify?.({ step: 5, stepName: "调用双模型 AI 分析…" });

      const { resultA, resultB } = await evaluateWithTruncationLoop(
        text,
        signals,
        deps.evaluateModelA,
        deps.evaluateModelB
      );

      // Step 6: Process results
      notify?.({ step: 6, stepName: "处理 AI 结果…" });

      const features = buildFeatures(signals);

      // Step 7: Generate report
      notify?.({ step: 7, stepName: "生成报告" });

      // Both succeeded
      if (resultA !== null && resultB !== null) {
        const scoresA = guardScores({
          hookScore: resultA.result.hookScore,
          climaxScore: resultA.result.climaxScore,
          cliffhangerScore: resultA.result.cliffhangerScore,
          pacingScore: resultA.result.pacingScore,
        });
        const scoresB = guardScores({
          hookScore: resultB.result.hookScore,
          climaxScore: resultB.result.climaxScore,
          cliffhangerScore: resultB.result.cliffhangerScore,
          pacingScore: resultB.result.pacingScore,
        });

        const divergence = detectDivergence(scoresA, scoresB);

        return {
          status: "complete",
          scores: {
            deepseek: scoresA,
            doubao: scoresB,
          },
          features,
          tokenUsage: {
            deepseek: resultA.usage,
            doubao: resultB.usage,
          },
          ...(divergence.length > 0 ? { divergence } : {}),
        };
      }

      // One succeeded
      if (resultA !== null) {
        const scores = guardScores({
          hookScore: resultA.result.hookScore,
          climaxScore: resultA.result.climaxScore,
          cliffhangerScore: resultA.result.cliffhangerScore,
          pacingScore: resultA.result.pacingScore,
        });
        return {
          status: "partial",
          scores,
          features,
          failedModel: "B",
          failedModelLabel: MODEL_LABEL_B,
          tokenUsage: resultA.usage,
        };
      }

      if (resultB !== null) {
        const scores = guardScores({
          hookScore: resultB.result.hookScore,
          climaxScore: resultB.result.climaxScore,
          cliffhangerScore: resultB.result.cliffhangerScore,
          pacingScore: resultB.result.pacingScore,
        });
        return {
          status: "partial",
          scores,
          features,
          failedModel: "A",
          failedModelLabel: MODEL_LABEL_A,
          tokenUsage: resultB.usage,
        };
      }

      // Both failed — degraded fallback
      const report = generateDegradeReport(features, "双模型均不可用（超时或API错误）");

      return {
        status: "degraded",
        report,
        features,
        reason: "双模型均不可用",
      };
    },
  };
}
