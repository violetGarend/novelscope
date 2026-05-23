import { NextResponse } from "next/server";
import { validateChapterText } from "../validate";
import { createEvaluationPipeline } from "@/services/pipeline";
import { analyzeClimax } from "@/services/climax";
import { analyzePacing } from "@/services/pacing";
import { detectFiller } from "@/services/filler";
import { analyzeHook } from "@/services/hook";
import { analyzeCliffhanger } from "@/services/cliffhanger";
import { createLLMClient, getLLMConfig } from "@/services/llm";
import type { LLMCallResult } from "@/services/llm";
import { calculateCost } from "@/lib/cost";
function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

const pipeline = createEvaluationPipeline(
  {
    analyzeClimax,
    analyzePacing,
    detectFiller,
    analyzeHook,
    analyzeCliffhanger,
    evaluateWithLLM: async (chapterText: string, prompt: string): Promise<LLMCallResult> => {
      const config = getLLMConfig();
      if (!config.apiKey) {
        const provider = process.env.LLM_PROVIDER || "deepseek";
        const keyName = provider === "doubao" ? "DOUBAO_API_KEY" : "DEEPSEEK_API_KEY";
        return {
          result: {
            hookScore: 5,
            climaxScore: 5,
            cliffhangerScore: 5,
            pacingScore: 5,
            consistencyIssues: [],
            highlights: ["（LLM 评估未启用）"],
            suggestions: [
              { severity: "info", location: "", issue: `建议配置 ${keyName} 以启用完整评估`, direction: "在 backend/.env 中设置环境变量" },
            ],
          },
          usage: { promptTokens: 0, completionTokens: 0 },
        };
      }
      const client = createLLMClient(config);
      return client.evaluateWithLLM(chapterText, prompt);
    },
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chapterText } = body;

    // 步骤 1：验证文本
    const validation = validateChapterText(chapterText);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(event: object) {
          controller.enqueue(encoder.encode(sse(event)));
        }

        // 步骤 1：正在验证文本
        send({ type: "progress", step: 1, stepName: "正在验证文本" });

        const result = await pipeline.evaluateChapter(chapterText, {
          onProgress: (event) => {
            send({ type: "progress", ...event });
          },
        });

        const tokenUsage = result.tokenUsage && result.tokenUsage.promptTokens > 0
          ? result.tokenUsage
          : null;
        const costEstimate = tokenUsage ? calculateCost(tokenUsage, getLLMConfig().model) : null;

        send({
          type: "result",
          reportId: `report_${Date.now()}`,
          scores: result.scores,
          climaxResult: result.climaxResult,
          pacingResult: result.pacingResult,
          fillerResult: result.fillerResult,
          hookResult: result.hookResult,
          cliffhangerResult: result.cliffhangerResult,
          llmResult: result.llmResult,
          isPartial: result.isPartial,
          hookSource: result.hookSource,
          cliffhangerSource: result.cliffhangerSource,
          tokenUsage,
          costEstimate,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "评估过程中发生错误" } },
      { status: 500 }
    );
  }
}
