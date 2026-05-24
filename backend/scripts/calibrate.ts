import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load .env from backend root
config({ path: path.resolve(__dirname, "../.env") });

import { createEvaluationPipeline } from "@/services/pipeline";
import { analyzeClimax } from "@/services/climax";
import { analyzePacing } from "@/services/pacing";
import { detectFiller } from "@/services/filler";
import { analyzeHook } from "@/services/hook";
import { analyzeCliffhanger } from "@/services/cliffhanger";
import { createLLMClient, getLLMConfig } from "@/services/llm";
import type { LLMCallResult } from "@/services/llm";
import { GOLDEN_SAMPLES } from "@/services/golden-sample/samples";
import {
  buildCalibrationResult,
  generateCalibrationReport,
} from "@/services/calibration";
import type { CalibrationSampleResult, CalibrationReport } from "@/services/calibration";

const RESULTS_DIR = path.resolve(__dirname, "../calibration-results");
const TOLERANCE = 1.5;
const ROUNDS = 3;

async function main() {
  const llmConfig = getLLMConfig();
  const { apiKey } = llmConfig;
  const llmProvider = process.env.LLM_PROVIDER || "deepseek";
  const keyName = llmProvider === "doubao" ? "DOUBAO_API_KEY" : "DEEPSEEK_API_KEY";

  const hasApiKey = apiKey && apiKey.trim() !== "";
  if (!hasApiKey) {
    console.log(`⚠ ${keyName} not set. Running in dry-run mode.`);
    console.log(`  Set ${keyName} in backend/.env to run with real LLM.\n`);
  }

  const pipeline = createEvaluationPipeline({
    analyzeClimax,
    analyzePacing,
    detectFiller,
    analyzeHook,
    analyzeCliffhanger,
    evaluateWithLLM: async (chapterText: string, prompt: string): Promise<LLMCallResult> => {
      if (!hasApiKey) {
        return {
          result: {
            hookScore: 5,
            climaxScore: 5,
            cliffhangerScore: 5,
            pacingScore: 5,
            consistencyIssues: [],
            highlights: ["（dry-run: LLM 评估未启用）"],
            suggestions: [
              { severity: "info", location: "", issue: `设置 ${keyName} 以启用完整评估`, direction: "在 backend/.env 中设置" },
            ],
          },
          usage: { promptTokens: 0, completionTokens: 0 },
        };
      }
      const client = createLLMClient({ ...llmConfig, maxRetries: 2 });
      return client.evaluateWithLLM(chapterText, prompt);
    },
  });

  console.log(`开始 Prompt v2 校准验证 (P1 Gate)`);
  console.log(`样本数: ${GOLDEN_SAMPLES.length} | 每样本轮数: ${ROUNDS} | 容差: ±${TOLERANCE}`);
  console.log(`模型: ${llmConfig.model} | 温度: 0\n`);

  const sampleResults: CalibrationSampleResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < GOLDEN_SAMPLES.length; i++) {
    const sample = GOLDEN_SAMPLES[i];
    process.stdout.write(`[${i + 1}/${GOLDEN_SAMPLES.length}] "${sample.name}" (${sample.lengthCategory}, ~${sample.text.length}字)... `);

    const rounds = [];
    for (let r = 1; r <= ROUNDS; r++) {
      const roundStart = Date.now();
      try {
        const result = await pipeline.evaluateChapter(sample.text);
        rounds.push({
          round: r,
          timestamp: new Date().toISOString(),
          scores: result.scores,
          tokenUsage: result.tokenUsage,
          durationMs: Date.now() - roundStart,
          llmAvailable: !result.isPartial,
        });
      } catch {
        rounds.push({
          round: r,
          timestamp: new Date().toISOString(),
          scores: { hookScore: 0, climaxScore: 0, cliffhangerScore: 0, pacingScore: 0 },
          tokenUsage: null,
          durationMs: Date.now() - roundStart,
          llmAvailable: false,
        });
      }
    }

    const calResult = buildCalibrationResult(
      sample.id,
      sample.name,
      rounds,
      sample.expectedRanges,
      TOLERANCE
    );

    const status = calResult.variancePass ? "✓" : "✗方差";
    const hit = calResult.allRangesHit ? "命中" : "偏离";
    console.log(`${status} | ${hit} | 池化方差: ${calResult.pooledVariance} | 高潮均分: ${calResult.rangesHit.climaxAvg}`);
    sampleResults.push(calResult);
  }

  // Generate report
  const provider = llmConfig.model.startsWith("doubao-") ? "Doubao" : "DeepSeek";
  const report = generateCalibrationReport(sampleResults, {
    provider,
    model: llmConfig.model,
    temperature: 0,
  });

  // Ensure output directory
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // Write JSON report
  const jsonPath = path.join(RESULTS_DIR, `calibration-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8");

  // Write latest symlink-alike copy
  const latestPath = path.join(RESULTS_DIR, "latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2), "utf-8");

  // Console output
  console.log(`\n═══════════════════════════════════════`);
  console.log(`  校准报告 — P1 Gate`);
  console.log(`═══════════════════════════════════════`);
  console.log(`模型: ${report.modelInfo.provider} ${report.modelInfo.model}`);
  console.log(`总轮数: ${report.summary.totalRounds} | 总样本: ${report.summary.totalSamples}`);
  console.log(`方差通过: ${report.gateDecision.stabilityCount}/${report.summary.totalSamples}`);
  console.log(`命中通过: ${report.gateDecision.hitCount}/${report.summary.totalSamples} (需 ≥4)`);
  console.log(`耗时: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log();

  // Per-sample summary
  for (const s of sampleResults) {
    const varIcon = s.variancePass ? "✓" : "✗";
    const hitIcon = s.allRangesHit ? "✓" : "✗";
    console.log(
      `  ${s.sampleId}: 方差${varIcon}(${s.pooledVariance}) 命中${hitIcon} 高潮${s.rangesHit.climaxAvg} vs ${s.rangesHit.climaxExpected.min}-${s.rangesHit.climaxExpected.max} 节奏${s.rangesHit.pacingAvg} vs ${s.rangesHit.pacingExpected.min}-${s.rangesHit.pacingExpected.max}`
    );
  }

  console.log();
  console.log(`═══════════════════════════════════════`);
  console.log(`  ${report.gateDecision.message}`);
  console.log(`═══════════════════════════════════════`);

  if (!report.gateDecision.passed) {
    console.log();
    console.log("调优建议:");
    for (const [i, suggestion] of report.gateDecision.tuningSuggestions.entries()) {
      console.log(`  ${i + 1}. ${suggestion}`);
    }
  }

  console.log();
  console.log(`JSON 报告: ${jsonPath}`);
  console.log(`最新报告: ${latestPath}`);

  if (!hasApiKey) {
    console.log("\n(Dry-run 模式，所有分数均为 mock=5，无法真实验证 Gate。)");
    process.exit(0);
  }

  process.exit(report.gateDecision.passed ? 0 : 1);
}

main().catch((err) => {
  console.error("校准失败:", err);
  process.exit(1);
});
