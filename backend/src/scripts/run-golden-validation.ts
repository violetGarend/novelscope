import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load .env from backend root
config({ path: path.resolve(__dirname, "../../.env") });

import { createEvaluationPipeline } from "@/services/pipeline";
import { analyzeClimax } from "@/services/climax";
import { analyzePacing } from "@/services/pacing";
import { detectFiller } from "@/services/filler";
import { createLLMClient } from "@/services/llm";
import type { LLMCallResult } from "@/services/llm";
import {
  createGoldenSampleRunner,
  generateMarkdownReport,
} from "@/services/golden-sample";
import type { GoldenValidationReport, PromptImprovementNote } from "@/services/golden-sample";
import { GOLDEN_SAMPLES } from "@/services/golden-sample/samples";

function collectImprovementNotes(report: GoldenValidationReport): PromptImprovementNote[] {
  const notes: PromptImprovementNote[] = [];

  // Check stability failures
  const unstableSamples = report.samples.filter((s) => !s.stabilityPass);
  if (unstableSamples.length > 0) {
    notes.push({
      issue: "评分稳定性不足",
      observation: `${unstableSamples.length}/${report.samples.length} 个样本未通过稳定性检查（方差 ≥ 0.5）。temperature=0 但分数仍有较大波动。样本: ${unstableSamples.map((s) => s.sampleId).join(", ")}`,
      suggestion: "检查 prompt 中对各维度评分标准的描述是否足够精确。考虑增加评分参考锚点（如'开头300字内是否有冲突'）以减少LLM理解偏差。",
    });
  }

  // Check human agreement failures
  const disagreeingSamples = report.samples.filter((s) => !s.humanAgreementPass);
  if (disagreeingSamples.length > 0) {
    notes.push({
      issue: "评分与人工预期偏差",
      observation: `${disagreeingSamples.length}/${report.samples.length} 个样本的 LLM 评分与人工预期范围不一致。样本: ${disagreeingSamples.map((s) => s.sampleId).join(", ")}`,
      suggestion: "逐一对比样本的实际评分与预期，检查是人工预期定义偏高/偏低，还是 LLM 对该类型文本的评分存在系统性偏差。必要时调整 ExpectedRanges。",
    });
  }

  // Check if all scores are biased (clustering around middle values)
  const allClimaxScores = report.samples.flatMap(
    (s) => s.rounds.map((r) => r.scores.climaxScore)
  );
  const avgClimax =
    allClimaxScores.reduce((a, b) => a + b, 0) / allClimaxScores.length;
  const allInTightRange = allClimaxScores.every(
    (s) => Math.abs(s - avgClimax) < 1.5
  );
  if (allInTightRange && avgClimax > 4 && avgClimax < 6) {
    notes.push({
      issue: "评分趋中倾向",
      observation: `所有样本的高潮评分集中在 ${(avgClimax - 1).toFixed(1)}-${(avgClimax + 1).toFixed(1)} 区间，可能存在'打平均分'倾向。`,
      suggestion: "在 prompt 中强调'极端文本应给出极端分数'，并增加0-2分和8-10分段的描述，鼓励使用完整评分范围。",
    });
  }

  return notes;
}

function generateRecommendations(report: GoldenValidationReport): string[] {
  const recs: string[] = [];

  if (!report.summary.overallStable) {
    recs.push("优先解决评分稳定性的根本原因，可能涉及 prompt 重构或模型参数调优。");
  }

  if (report.summary.humanAgreementPassCount < report.summary.totalSamples * 0.7) {
    recs.push(
      "人工一致性低于 70%，建议复查 ExpectedRanges 定义是否合理，或邀请更多人工标注者校准预期范围。"
    );
  }

  recs.push("在每轮 Prompt 迭代后重新运行此验证，追踪评分稳定性的变化趋势。");
  recs.push("考虑增加更多不同题材的 Golden Sample（如悬疑、搞笑、系统流），覆盖更广泛的网文类型。");

  return recs;
}

async function main() {
  // Check for API key
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.log("⚠ DEEPSEEK_API_KEY not set. Running in dry-run mode (mock data).");
    console.log("  Set DEEPSEEK_API_KEY in backend/.env to run with real LLM.\n");
  }

  // Build pipeline with real services
  const pipeline = createEvaluationPipeline({
    analyzeClimax,
    analyzePacing,
    detectFiller,
    evaluateWithLLM: async (chapterText: string, prompt: string): Promise<LLMCallResult> => {
      if (!apiKey || apiKey.trim() === "") {
        // Mock mode
        return {
          result: {
            hookScore: 5,
            climaxScore: 5,
            cliffhangerScore: 5,
            pacingScore: 5,
            consistencyIssues: [],
            highlights: ["（dry-run: LLM 评估未启用）"],
            suggestions: ["设置 DEEPSEEK_API_KEY 环境变量以启用完整评估"],
          },
          usage: { promptTokens: 0, completionTokens: 0 },
        };
      }
      const client = createLLMClient({ apiKey, maxRetries: 2 });
      return client.evaluateWithLLM(chapterText, prompt);
    },
  });

  const runner = createGoldenSampleRunner(
    { evaluateChapter: (text) => pipeline.evaluateChapter(text) },
    GOLDEN_SAMPLES,
    { rounds: 3 }
  );

  console.log(
    `开始 Golden Sample 验证: ${GOLDEN_SAMPLES.length} 个样本 × 3 轮...\n`
  );

  const startTime = Date.now();

  // Run each sample and report progress
  const sampleResults = [];
  for (let i = 0; i < GOLDEN_SAMPLES.length; i++) {
    const sample = GOLDEN_SAMPLES[i];
    process.stdout.write(
      `[${i + 1}/${GOLDEN_SAMPLES.length}] 评估 "${sample.name}" (${sample.lengthCategory}, ~${sample.text.length}字)... `
    );
    const result = await runner.validateSample(sample);
    const status = result.stabilityPass ? "✓" : "✗";
    const agree = result.humanAgreementPass ? "一致" : "偏差";
    console.log(
      `完成 | 稳定性: ${status} | 一致性: ${agree} | 高潮均分: ${(result.rounds.reduce((a, r) => a + r.scores.climaxScore, 0) / result.rounds.length).toFixed(1)}`
    );
    sampleResults.push(result);
  }

  // Build full report
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

  const report: GoldenValidationReport = {
    generatedAt: new Date().toISOString(),
    modelInfo: {
      provider: "DeepSeek",
      model: "deepseek-chat",
      temperature: 0,
    },
    summary: {
      totalSamples: sampleResults.length,
      roundsPerSample: 3,
      stabilityPassCount: sampleResults.filter((r) => r.stabilityPass).length,
      humanAgreementPassCount: sampleResults.filter(
        (r) => r.humanAgreementPass
      ).length,
      overallStable: sampleResults.every((r) => r.stabilityPass),
      totalTokensUsed: {
        promptTokens: totalPrompt,
        completionTokens: totalCompletion,
      },
      totalCostEstimate:
        (totalPrompt / 1_000_000) * 1 + (totalCompletion / 1_000_000) * 2,
      totalDurationMs: Date.now() - startTime,
    },
    samples: sampleResults,
    promptImprovementNotes: [],
    recommendations: [],
  };

  // Auto-detect issues and generate notes
  report.promptImprovementNotes = collectImprovementNotes(report);
  report.recommendations = generateRecommendations(report);

  // Generate markdown and write
  const markdown = generateMarkdownReport(report);
  const outputPath = path.resolve(__dirname, "../../../docs/golden-sample-report.md");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, "utf-8");

  console.log(`\n报告已生成: ${outputPath}`);
  console.log(`总耗时: ${(report.summary.totalDurationMs / 1000).toFixed(1)}s`);
  console.log(
    `稳定性: ${report.summary.stabilityPassCount}/${report.summary.totalSamples}`
  );
  console.log(
    `人工一致性: ${report.summary.humanAgreementPassCount}/${report.summary.totalSamples}`
  );
  console.log(
    `Token 用量: prompt=${totalPrompt}, completion=${totalCompletion}`
  );
  console.log(`成本: ¥${report.summary.totalCostEstimate.toFixed(6)}`);
  console.log(`\nPrompt 改进建议: ${report.promptImprovementNotes.length} 条`);
  for (const note of report.promptImprovementNotes) {
    console.log(`  - ${note.issue}: ${note.suggestion}`);
  }

  // Exit code: pass if 60%+ stable and 60%+ agree
  const stabilityRatio =
    report.summary.stabilityPassCount / report.summary.totalSamples;
  const agreementRatio =
    report.summary.humanAgreementPassCount / report.summary.totalSamples;
  const passed = stabilityRatio >= 0.6 && agreementRatio >= 0.6;

  if (!apiKey || apiKey.trim() === "") {
    console.log("\n（Dry-run 模式，无需 API Key。）");
    process.exit(0);
  }

  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error("Golden validation 失败:", err);
  process.exit(1);
});
