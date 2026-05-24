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
import { guardScores, type ValidatedScores } from "../guard";
import type { LLMCallResult } from "../llm/client";
import type { TokenUsage } from "../llm/client";

// ── Divergence detection ──

export function detectDivergence(a: DimensionScores, b: DimensionScores): DivergenceReport {
  const dimensions: Array<{ key: string; label: string }> = [
    { key: "hookScore", label: "hookScore" },
    { key: "climaxScore", label: "climaxScore" },
    { key: "cliffhangerScore", label: "cliffhangerScore" },
    { key: "pacingScore", label: "pacingScore" },
  ];

  const report: DivergenceReport = [];
  for (const { key } of dimensions) {
    const va = a[key as keyof DimensionScores];
    const vb = b[key as keyof DimensionScores];
    const delta = Math.abs(va - vb);
    if (delta > 2) {
      report.push({
        dimension: key,
        deepseek: va,
        doubao: vb,
        delta,
      });
    }
  }
  return report;
}

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

// ── Degraded report (template NLG — final fallback) ──

export function generateDegradedReport(features: AllFeatures, reason: string): string {
  const lines: string[] = [];
  lines.push("【AI 评估暂不可用 — 以下为规则引擎自动分析】");
  lines.push("");
  lines.push(`原因: ${reason}`);
  lines.push("");

  // Hook section
  const hookTypeLabels: Record<string, string> = {
    conflict: "冲突开场",
    suspense: "悬念开场",
    dialogue: "对话开场",
    description: "描写开场",
    mixed: "混合开场",
  };
  lines.push("## 开头分析");
  lines.push(`开头类型为"${hookTypeLabels[features.hook.openingType] ?? features.hook.openingType}"，`);
  lines.push(`冲突关键词命中 ${features.hook.conflictHitCount} 处，悬念关键词命中 ${features.hook.suspenseHitCount} 处。`);
  lines.push(features.hook.hasGoldenLine ? "检测到金句。" : "未检测到标志性金句。");
  lines.push("");

  // Climax section
  lines.push("## 爽点分析");
  if (features.climax.matchedKeywords.length > 0) {
    lines.push(`命中爽点关键词: ${features.climax.matchedKeywords.join("、")}`);
  } else {
    lines.push("未命中爽点关键词。");
  }
  lines.push(`对话密度: ${features.climax.dialogueDensity}，冲突密度: ${features.climax.conflictDensity}`);
  lines.push("");

  // Pacing section
  lines.push("## 节奏分析");
  lines.push(`段落数: ${features.pacing.curve.length}，变异系数: ${features.pacing.cv}`);
  lines.push(`动作/对话/描写比例: ${Math.round(features.pacing.typeRatio.action * 100)}%/${Math.round(features.pacing.typeRatio.dialogue * 100)}%/${Math.round(features.pacing.typeRatio.description * 100)}%`);
  lines.push("");

  // Filler section
  lines.push("## 注水检测");
  if (features.filler.items.length > 0) {
    lines.push(`检测到 ${features.filler.items.length} 处疑似注水段落。`);
  } else {
    lines.push("未检测到明显注水。");
  }
  lines.push("");

  // Cliffhanger section
  const endingTypeLabels: Record<string, string> = {
    suspense: "悬念收尾",
    question: "疑问收尾",
    emotional: "情绪收尾",
    reversal: "反转收尾",
    action: "行动收尾",
    flat: "平坦收尾",
  };
  lines.push("## 章末悬念");
  lines.push(`结尾类型为"${endingTypeLabels[features.cliffhanger.endingType] ?? features.cliffhanger.endingType}"，`);
  lines.push(`悬念关键词命中 ${features.cliffhanger.suspenseHitCount} 处。`);
  lines.push(features.cliffhanger.hasReversalHint ? "检测到反转暗示。" : "未检测到明确反转暗示。");
  lines.push("");

  lines.push("---");
  lines.push("*以上为规则引擎自动分析，AI 深度评估暂时不可用。请稍后重试。*");

  return lines.join("\n");
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
      const report = generateDegradedReport(features, "双模型均不可用（超时或API错误）");

      return {
        status: "degraded",
        report,
        features,
        reason: "双模型均不可用",
      };
    },
  };
}
