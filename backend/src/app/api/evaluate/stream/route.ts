import { NextResponse } from "next/server";
import { validateChapterText } from "../validate";
import { createDualModelPipeline } from "@/services/pipeline/orchestrator";
import { analyzeClimax } from "@/services/climax";
import { analyzePacing } from "@/services/pacing";
import { detectFiller } from "@/services/filler";
import { analyzeHook } from "@/services/hook";
import { analyzeCliffhanger } from "@/services/cliffhanger";
import { createLLMClient } from "@/services/llm";
import type { LLMCallResult } from "@/services/llm";

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

const DEEPSEEK_CONFIG = {
  model: "deepseek-v4-flash",
  baseURL: "https://api.deepseek.com/v1",
} as const;

const DOUBAO_CONFIG = {
  model: "doubao-seed-2-0-lite-260428",
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
} as const;

const pipeline = createDualModelPipeline({
  analyzeClimax,
  analyzePacing,
  detectFiller,
  analyzeHook,
  analyzeCliffhanger,
  evaluateModelA: async (text: string, prompt: string): Promise<LLMCallResult> => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY not configured");
    }
    const client = createLLMClient({
      apiKey,
      model: DEEPSEEK_CONFIG.model,
      baseURL: DEEPSEEK_CONFIG.baseURL,
    });
    return client.evaluateWithLLM(text, prompt);
  },
  evaluateModelB: async (text: string, prompt: string): Promise<LLMCallResult> => {
    const apiKey = process.env.DOUBAO_API_KEY;
    if (!apiKey) {
      throw new Error("DOUBAO_API_KEY not configured");
    }
    const client = createLLMClient({
      apiKey,
      model: DOUBAO_CONFIG.model,
      baseURL: DOUBAO_CONFIG.baseURL,
    });
    return client.evaluateWithLLM(text, prompt);
  },
});

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

        // Send V2 result (discriminated union)
        send({ type: "result", ...result });

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
