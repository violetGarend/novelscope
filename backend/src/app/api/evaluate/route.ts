import { NextResponse } from "next/server";
import { validateChapterText } from "./validate";
import { createEvaluationPipeline } from "@/services/pipeline";
import { analyzeClimax } from "@/services/climax";
import { analyzePacing } from "@/services/pacing";
import { detectFiller } from "@/services/filler";
import { createLLMClient } from "@/services/llm";
import type { LLMCallResult } from "@/services/llm";
import { calculateCost } from "@/lib/cost";
import { CORS_HEADERS } from "@/lib/cors";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const pipeline = createEvaluationPipeline({
  analyzeClimax,
  analyzePacing,
  detectFiller,
  evaluateWithLLM: async (chapterText: string, prompt: string): Promise<LLMCallResult> => {
    // P0 阶段：如果没有 API key，返回 mock 数据
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return {
        result: {
          hookScore: 5,
          climaxScore: 5,
          cliffhangerScore: 5,
          pacingScore: 5,
          consistencyIssues: [],
          highlights: ["（P0 阶段：LLM 评估未启用）"],
          suggestions: ["建议配置 DEEPSEEK_API_KEY 以启用完整评估"],
        },
        usage: { promptTokens: 0, completionTokens: 0 },
      };
    }
    const client = createLLMClient({ apiKey });
    return client.evaluateWithLLM(chapterText, prompt);
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chapterText } = body;

    const validation = validateChapterText(chapterText);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await pipeline.evaluateChapter(chapterText);

    const tokenUsage = result.tokenUsage && result.tokenUsage.promptTokens > 0
      ? result.tokenUsage
      : null;
    const costEstimate = tokenUsage ? calculateCost(tokenUsage) : null;

    return NextResponse.json({
      reportId: `report_${Date.now()}`,
      scores: result.scores,
      climaxResult: result.climaxResult,
      pacingResult: result.pacingResult,
      fillerResult: result.fillerResult,
      llmResult: result.llmResult,
      isPartial: result.isPartial,
      tokenUsage,
      costEstimate,
    }, { headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "评估过程中发生错误" } },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
