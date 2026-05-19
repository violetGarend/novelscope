import { NextResponse } from "next/server";
import { validateChapterText } from "../validate";
import { createEvaluationPipeline } from "@/services/pipeline";
import { analyzeClimax } from "@/services/climax";
import { analyzePacing } from "@/services/pacing";
import { detectFiller } from "@/services/filler";
import { createLLMClient } from "@/services/llm";
import { CORS_HEADERS } from "@/lib/cors";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

const pipeline = createEvaluationPipeline(
  {
    analyzeClimax,
    analyzePacing,
    detectFiller,
    evaluateWithLLM: async (chapterText: string, prompt: string) => {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        return {
          hookScore: 5,
          climaxScore: 5,
          cliffhangerScore: 5,
          pacingScore: 5,
          consistencyIssues: [],
          highlights: ["（P0 阶段：LLM 评估未启用）"],
          suggestions: ["建议配置 DEEPSEEK_API_KEY 以启用完整评估"],
        };
      }
      const client = createLLMClient({ apiKey });
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
        { status: 400, headers: CORS_HEADERS }
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

        send({
          type: "result",
          reportId: `report_${Date.now()}`,
          scores: result.scores,
          climaxResult: result.climaxResult,
          pacingResult: result.pacingResult,
          fillerResult: result.fillerResult,
          llmResult: result.llmResult,
          isPartial: result.isPartial,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "评估过程中发生错误" } },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
