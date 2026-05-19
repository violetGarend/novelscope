import { NextResponse } from "next/server";
import { validateChapterText } from "./validate";
import { createEvaluationPipeline } from "@/services/pipeline";
import { analyzeClimax } from "@/services/climax";
import { analyzePacing } from "@/services/pacing";
import { detectFiller } from "@/services/filler";
import { createLLMClient } from "@/services/llm";

const pipeline = createEvaluationPipeline({
  analyzeClimax,
  analyzePacing,
  detectFiller,
  evaluateWithLLM: async () => {
    // P0 阶段：如果没有 API key，返回 mock 数据
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return {
        hookScore: 5,
        cliffhangerScore: 5,
        consistencyIssues: [],
        highlights: ["（P0 阶段：LLM 评估未启用）"],
        suggestions: ["建议配置 DEEPSEEK_API_KEY 以启用完整评估"],
      };
    }
    const client = createLLMClient({ apiKey });
    return client.evaluateWithLLM("", "");
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
        { status: 400 }
      );
    }

    const result = await pipeline.evaluateChapter(chapterText);

    return NextResponse.json({
      reportId: `report_${Date.now()}`,
      scores: result.scores,
      climaxResult: result.climaxResult,
      pacingResult: result.pacingResult,
      fillerResult: result.fillerResult,
      llmResult: result.llmResult,
      isPartial: result.isPartial,
      tokenUsage: null,
      costEstimate: null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "评估过程中发生错误" } },
      { status: 500 }
    );
  }
}
