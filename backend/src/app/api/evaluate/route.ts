import { NextResponse } from "next/server";
import { validateChapterText } from "./validate";
import { analyzeClimax } from "@/services/climax";
import { analyzePacing } from "@/services/pacing";
import { detectFiller } from "@/services/filler";
import { analyzeHook } from "@/services/hook";
import { analyzeCliffhanger } from "@/services/cliffhanger";
import { createLLMClient } from "@/services/llm";
import type { LLMCallResult } from "@/services/llm";
import { calculateCost } from "@/lib/cost";
import { createDualModelPipeline } from "@/services/pipeline/orchestrator";
import type { EvaluationResultV2 } from "@/services/pipeline/types";

// ── Default model configs ──

const DEEPSEEK_CONFIG = {
  model: "deepseek-v4-flash",
  baseURL: "https://api.deepseek.com/v1",
} as const;

const DOUBAO_CONFIG = {
  model: "doubao-seed-2-0-lite-260428",
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
} as const;

function buildEvaluateFn(apiKey: string | undefined, model: string, baseURL: string) {
  return async (chapterText: string, prompt: string): Promise<LLMCallResult> => {
    if (!apiKey || apiKey.trim() === "") {
      return {
        result: {
          hookScore: 5,
          climaxScore: 5,
          cliffhangerScore: 5,
          pacingScore: 5,
          consistencyIssues: [],
          highlights: ["（LLM 评估未启用）"],
          suggestions: [
            { severity: "info", location: "", issue: `配置 API Key 以启用完整评估`, direction: "在 backend/.env 中设置环境变量" },
          ],
        },
        usage: { promptTokens: 0, completionTokens: 0 },
      };
    }
    const client = createLLMClient({ apiKey, model, baseURL, maxRetries: 1, timeout: 45000 });
    return client.evaluateWithLLM(chapterText, prompt);
  };
}

const pipeline = createDualModelPipeline({
  analyzeClimax,
  analyzePacing,
  detectFiller,
  analyzeHook,
  analyzeCliffhanger,
  evaluateModelA: buildEvaluateFn(
    process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_CONFIG.model,
    DEEPSEEK_CONFIG.baseURL
  ),
  evaluateModelB: buildEvaluateFn(
    process.env.DOUBAO_API_KEY,
    DOUBAO_CONFIG.model,
    DOUBAO_CONFIG.baseURL
  ),
});

// ── Helpers ──

function computeCost(tokenUsage: unknown, model: string): number | null {
  if (!tokenUsage || typeof tokenUsage !== "object") return null;
  const usage = tokenUsage as { promptTokens: number; completionTokens: number };
  if (usage.promptTokens <= 0 || usage.completionTokens <= 0) return null;
  return calculateCost(usage, model);
}

function buildResponse(result: EvaluationResultV2, reportId: string) {
  switch (result.status) {
    case "complete": {
      const deepseekCost = computeCost(result.tokenUsage.deepseek, DEEPSEEK_CONFIG.model);
      const doubaoCost = computeCost(result.tokenUsage.doubao, DOUBAO_CONFIG.model);
      return {
        reportId,
        status: "complete" as const,
        scores: result.scores,
        features: result.features,
        tokenUsage: result.tokenUsage,
        costEstimate: deepseekCost !== null || doubaoCost !== null
          ? { deepseek: deepseekCost, doubao: doubaoCost }
          : null,
        ...(result.divergence ? { divergence: result.divergence } : {}),
      };
    }
    case "partial": {
      const model = result.failedModel === "A" ? DOUBAO_CONFIG.model : DEEPSEEK_CONFIG.model;
      const cost = computeCost(result.tokenUsage, model);
      return {
        reportId,
        status: "partial" as const,
        scores: result.scores,
        features: result.features,
        failedModel: result.failedModelLabel,
        tokenUsage: result.tokenUsage,
        costEstimate: cost,
      };
    }
    case "degraded":
      return {
        reportId,
        status: "degraded" as const,
        report: result.report,
        features: result.features,
        reason: result.reason,
      };
  }
}

// ── Route handler ──

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chapterText } = body;

    const validation = validateChapterText(chapterText);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const result = await pipeline.evaluateChapter(chapterText);
    const reportId = `report_${Date.now()}`;
    const response = buildResponse(result, reportId);

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "评估过程中发生错误" } },
      { status: 500 }
    );
  }
}
