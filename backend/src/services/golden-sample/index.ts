import type { ValidatedScores } from "../guard";
import type { TokenUsage } from "../llm";
import type { EvaluationResult } from "../pipeline";
import { checkVariance } from "../guard";
import { calculateCost } from "@/lib/cost";

// ── Golden Sample Definition ──

export interface ExpectedRanges {
  climaxScore: { min: number; max: number };
  pacingScore: { min: number; max: number };
  filler: "none" | "low" | "moderate" | "high";
}

export interface GoldenSample {
  id: string;
  name: string;
  description: string;
  text: string;
  lengthCategory: "short" | "medium" | "long";
  expectedRanges: ExpectedRanges;
}

// ── Validation Results ──

export interface RoundResult {
  round: number;
  timestamp: string;
  scores: ValidatedScores;
  tokenUsage: TokenUsage | null;
  durationMs: number;
  llmAvailable: boolean;
}

export interface VarianceReport {
  hookScore: number;
  climaxScore: number;
  cliffhangerScore: number;
  pacingScore: number;
}

export interface ExpectedRangeCheck {
  climaxInRange: boolean;
  pacingInRange: boolean;
  climaxAvgDiff: number;
  pacingAvgDiff: number;
  climaxExpectedRange: string;
  pacingExpectedRange: string;
  fillerAssessment: string;
}

export interface SampleValidationResult {
  sampleId: string;
  sampleName: string;
  rounds: RoundResult[];
  variance: VarianceReport;
  stabilityPass: boolean;
  expectedRangeCheck: ExpectedRangeCheck;
  humanAgreementPass: boolean;
}

export interface PromptImprovementNote {
  issue: string;
  observation: string;
  suggestion: string;
}

export interface GoldenValidationReport {
  generatedAt: string;
  modelInfo: {
    provider: string;
    model: string;
    temperature: number;
  };
  summary: {
    totalSamples: number;
    roundsPerSample: number;
    stabilityPassCount: number;
    humanAgreementPassCount: number;
    overallStable: boolean;
    totalTokensUsed: TokenUsage;
    totalCostEstimate: number;
    totalDurationMs: number;
  };
  samples: SampleValidationResult[];
  promptImprovementNotes: PromptImprovementNote[];
  recommendations: string[];
}

// ── Runner Interface ──

export interface GoldenSampleRunnerDependencies {
  evaluateChapter: (text: string) => Promise<EvaluationResult>;
}

export interface GoldenSampleRunner {
  validateSample(sample: GoldenSample, rounds?: number): Promise<SampleValidationResult>;
  validateAll(): Promise<GoldenValidationReport>;
}

// ── Helpers ──

function computeVarianceReport(rounds: RoundResult[]): VarianceReport {
  const extract = (fn: (s: ValidatedScores) => number) =>
    rounds.map((r) => fn(r.scores));

  const hV = checkVariance(extract((s) => s.hookScore));
  const cV = checkVariance(extract((s) => s.climaxScore));
  const chV = checkVariance(extract((s) => s.cliffhangerScore));
  const pV = checkVariance(extract((s) => s.pacingScore));

  return {
    hookScore: hV.variance,
    climaxScore: cV.variance,
    cliffhangerScore: chV.variance,
    pacingScore: pV.variance,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeExpectedRangeCheck(
  sample: GoldenSample,
  rounds: RoundResult[]
): ExpectedRangeCheck {
  const avgClimax = average(rounds.map((r) => r.scores.climaxScore));
  const avgPacing = average(rounds.map((r) => r.scores.pacingScore));
  const climaxMid =
    (sample.expectedRanges.climaxScore.min + sample.expectedRanges.climaxScore.max) / 2;
  const pacingMid =
    (sample.expectedRanges.pacingScore.min + sample.expectedRanges.pacingScore.max) / 2;

  // Count rounds with filler detected (use first round as indicative)
  const firstRound = rounds[0];
  const fillerCount = firstRound
    ? firstRound.scores.pacingScore < 4
      ? "偏多"
      : firstRound.scores.pacingScore < 7
        ? "适中"
        : "偏少"
    : "未知";

  return {
    climaxInRange:
      avgClimax >= sample.expectedRanges.climaxScore.min &&
      avgClimax <= sample.expectedRanges.climaxScore.max,
    pacingInRange:
      avgPacing >= sample.expectedRanges.pacingScore.min &&
      avgPacing <= sample.expectedRanges.pacingScore.max,
    climaxAvgDiff: Math.round(Math.abs(avgClimax - climaxMid) * 100) / 100,
    pacingAvgDiff: Math.round(Math.abs(avgPacing - pacingMid) * 100) / 100,
    climaxExpectedRange: `[${sample.expectedRanges.climaxScore.min}, ${sample.expectedRanges.climaxScore.max}]`,
    pacingExpectedRange: `[${sample.expectedRanges.pacingScore.min}, ${sample.expectedRanges.pacingScore.max}]`,
    fillerAssessment: `预期: ${sample.expectedRanges.filler} | 实际检测注水倾向: ${fillerCount}`,
  };
}

// ── Factory ──

export function createGoldenSampleRunner(
  deps: GoldenSampleRunnerDependencies,
  samples: GoldenSample[],
  config?: { rounds?: number }
): GoldenSampleRunner {
  const defaultRounds = config?.rounds ?? 3;

  return {
    async validateSample(sample, rounds = defaultRounds) {
      const roundResults: RoundResult[] = [];

      for (let r = 1; r <= rounds; r++) {
        const start = Date.now();
        let scores: ValidatedScores;
        let tokenUsage: TokenUsage | null = null;
        let llmAvailable = false;

        try {
          const result = await deps.evaluateChapter(sample.text);
          scores = result.scores;
          tokenUsage = result.tokenUsage;
          llmAvailable = !result.isPartial;
        } catch {
          scores = {
            hookScore: 0,
            climaxScore: 0,
            cliffhangerScore: 0,
            pacingScore: 0,
          };
        }

        roundResults.push({
          round: r,
          timestamp: new Date().toISOString(),
          scores,
          tokenUsage,
          llmAvailable,
          durationMs: Date.now() - start,
        });
      }

      const variance = computeVarianceReport(roundResults);
      const expectedRangeCheck = computeExpectedRangeCheck(sample, roundResults);

      return {
        sampleId: sample.id,
        sampleName: sample.name,
        rounds: roundResults,
        variance,
        stabilityPass: Object.values(variance).every((v) => v < 0.5),
        expectedRangeCheck,
        humanAgreementPass:
          expectedRangeCheck.climaxInRange && expectedRangeCheck.pacingInRange,
      };
    },

    async validateAll() {
      const start = Date.now();
      const sampleResults: SampleValidationResult[] = [];

      for (const sample of samples) {
        const result = await this.validateSample(sample);
        sampleResults.push(result);
      }

      let totalPrompt = 0;
      let totalCompletion = 0;
      for (const sr of sampleResults) {
        for (const rr of sr.rounds) {
          if (rr.tokenUsage) {
            totalPrompt += rr.tokenUsage.promptTokens;
            totalCompletion += rr.tokenUsage.completionTokens;
          }
        }
      }
      const totalTokens: TokenUsage = {
        promptTokens: totalPrompt,
        completionTokens: totalCompletion,
      };

      return {
        generatedAt: new Date().toISOString(),
        modelInfo: {
          provider: "DeepSeek",
          model: "deepseek-v4-flash",
          temperature: 0,
        },
        summary: {
          totalSamples: sampleResults.length,
          roundsPerSample: defaultRounds,
          stabilityPassCount: sampleResults.filter((r) => r.stabilityPass).length,
          humanAgreementPassCount: sampleResults.filter(
            (r) => r.humanAgreementPass
          ).length,
          overallStable: sampleResults.every((r) => r.stabilityPass),
          totalTokensUsed: totalTokens,
          totalCostEstimate: calculateCost(totalTokens),
          totalDurationMs: Date.now() - start,
        },
        samples: sampleResults,
        promptImprovementNotes: [],
        recommendations: [],
      };
    },
  };
}

// ── Report Generator ──

function formatScoreTable(rounds: RoundResult[]): string {
  const header =
    "| 轮次 | Hook | 高潮 | 悬念 | 节奏 | LLM | 耗时 |\n" +
    "|------|------|------|------|------|-----|------|";
  const rows = rounds.map((r) => {
    const status = r.llmAvailable ? "✓" : "✗";
    return `| R${r.round} | ${r.scores.hookScore} | ${r.scores.climaxScore} | ${r.scores.cliffhangerScore} | ${r.scores.pacingScore} | ${status} | ${r.durationMs}ms |`;
  });
  return [header, ...rows].join("\n");
}

function formatVarianceTable(v: VarianceReport): string {
  return (
    "| 维度 | 方差 | 判定 |\n" +
    "|------|------|------|\n" +
    `| Hook | ${v.hookScore} | ${v.hookScore < 0.5 ? "✓" : "✗"} |\n` +
    `| 高潮 | ${v.climaxScore} | ${v.climaxScore < 0.5 ? "✓" : "✗"} |\n` +
    `| 悬念 | ${v.cliffhangerScore} | ${v.cliffhangerScore < 0.5 ? "✓" : "✗"} |\n` +
    `| 节奏 | ${v.pacingScore} | ${v.pacingScore < 0.5 ? "✓" : "✗"} |`
  );
}

export function generateMarkdownReport(report: GoldenValidationReport): string {
  const lines: string[] = [];

  lines.push("# Golden Sample 验证报告");
  lines.push("");
  lines.push(`**生成时间**: ${report.generatedAt}`);
  lines.push(
    `**模型**: ${report.modelInfo.provider} ${report.modelInfo.model} (temperature=${report.modelInfo.temperature})`
  );
  lines.push(
    `**样本数**: ${report.summary.totalSamples} | **每样本轮数**: ${report.summary.roundsPerSample}`
  );
  lines.push("");

  // Summary
  lines.push("## 总体结果");
  lines.push("");
  const overallStableText = report.summary.overallStable ? "✓ 通过" : "✗ 未通过";
  lines.push("| 指标 | 结果 |");
  lines.push("|------|------|");
  lines.push(
    `| 稳定性通过 | ${report.summary.stabilityPassCount}/${report.summary.totalSamples} (${Math.round((report.summary.stabilityPassCount / report.summary.totalSamples) * 100)}%) |`
  );
  lines.push(
    `| 人工一致性通过 | ${report.summary.humanAgreementPassCount}/${report.summary.totalSamples} (${Math.round((report.summary.humanAgreementPassCount / report.summary.totalSamples) * 100)}%) |`
  );
  lines.push(`| 整体稳定 | ${overallStableText} |`);
  lines.push(
    `| 总 Token 用量 | prompt: ${report.summary.totalTokensUsed.promptTokens} / completion: ${report.summary.totalTokensUsed.completionTokens} |`
  );
  lines.push(`| 总成本 | ¥${report.summary.totalCostEstimate.toFixed(6)} |`);
  lines.push(`| 总耗时 | ${(report.summary.totalDurationMs / 1000).toFixed(1)}s |`);
  lines.push("");

  // Per-sample details
  lines.push("## 各样本详情");
  lines.push("");

  for (const sample of report.samples) {
    const stabilityLabel = sample.stabilityPass ? "✓ 稳定" : "✗ 不稳定";
    const agreementLabel = sample.humanAgreementPass ? "✓ 一致" : "✗ 偏差";

    lines.push(`### ${sample.sampleId}: ${sample.sampleName}`);
    lines.push("");
    lines.push(`**稳定性**: ${stabilityLabel} | **人工一致性**: ${agreementLabel}`);
    lines.push("");

    lines.push("#### 各轮评分");
    lines.push("");
    lines.push(formatScoreTable(sample.rounds));
    lines.push("");

    lines.push("#### 方差分析");
    lines.push("");
    lines.push(formatVarianceTable(sample.variance));
    lines.push("");

    lines.push("#### 预期范围检查");
    lines.push("");
    lines.push(
      `| 维度 | 实际均值 | 预期范围 | 偏差 | 判定 |`
    );
    lines.push(
      `|------|----------|----------|------|------|`
    );
    const avgClimax = average(sample.rounds.map((r) => r.scores.climaxScore));
    const avgPacing = average(sample.rounds.map((r) => r.scores.pacingScore));
    lines.push(
      `| 高潮 | ${avgClimax.toFixed(1)} | ${sample.expectedRangeCheck.climaxExpectedRange} | ${sample.expectedRangeCheck.climaxAvgDiff} | ${sample.expectedRangeCheck.climaxInRange ? "✓" : "✗"} |`
    );
    lines.push(
      `| 节奏 | ${avgPacing.toFixed(1)} | ${sample.expectedRangeCheck.pacingExpectedRange} | ${sample.expectedRangeCheck.pacingAvgDiff} | ${sample.expectedRangeCheck.pacingInRange ? "✓" : "✗"} |`
    );
    lines.push(`| 注水 | — | ${sample.expectedRangeCheck.fillerAssessment} | — | — |`);
    lines.push("");
  }

  // Prompt improvement notes
  if (report.promptImprovementNotes.length > 0) {
    lines.push("## Prompt 改进记录");
    lines.push("");
    for (const note of report.promptImprovementNotes) {
      lines.push(`### ${note.issue}`);
      lines.push("");
      lines.push(`- **观察**: ${note.observation}`);
      lines.push(`- **建议**: ${note.suggestion}`);
      lines.push("");
    }
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push("## 建议");
    lines.push("");
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
