import OpenAI from "openai";
import { LLMResultSchema, type LLMResult } from "./schema";

export class LLMClientError extends Error {
  constructor(
    message: string,
    public readonly code: "TIMEOUT" | "RATE_LIMIT" | "INVALID_RESPONSE" | "VALIDATION_ERROR",
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "LLMClientError";
  }
}

export interface LLMClientConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface LLMCallResult {
  result: LLMResult;
  usage: TokenUsage;
}

export interface LLMClient {
  evaluateWithLLM(text: string, prompt: string): Promise<LLMCallResult>;
}

const DEFAULT_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_TIMEOUT = 45000;

function stripMarkdownFences(content: string): string {
  // 移除 ```json ... ``` 或 ``` ... ```
  const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = content.match(fenceRegex);
  return match ? match[1].trim() : content.trim();
}

function parseAndValidateLLMResponse(content: string): LLMResult {
  const cleaned = stripMarkdownFences(content);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new LLMClientError(
      "Failed to parse LLM response as JSON",
      "INVALID_RESPONSE",
      e instanceof Error ? e : undefined
    );
  }

  const result = LLMResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new LLMClientError(
      `LLM response validation failed: ${result.error.message}`,
      "VALIDATION_ERROR"
    );
  }

  return result.data;
}

function getDelay(attempt: number, isTimeout: boolean): number {
  // 超时: 1s → 2s, 429: 2s → 4s
  const baseDelay = isTimeout ? 1000 : 2000;
  return baseDelay * Math.pow(2, attempt);
}

function isTimeoutError(error: Error): boolean {
  return (
    error.message.includes("timed out") ||
    error.message.includes("timeout") ||
    error.message.includes("ETIMEDOUT")
  );
}

function isRateLimitError(error: Error): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (error as any).status === 429 || error.message.includes("429");
}

export function createLLMClient(config: LLMClientConfig): LLMClient {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL || DEFAULT_BASE_URL,
    timeout: config.timeout ?? DEFAULT_TIMEOUT,
  });

  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;

  return {
    async evaluateWithLLM(text: string, prompt: string): Promise<LLMCallResult> {
      let lastError: Error | undefined;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await openai.chat.completions.create({
            model: config.model,
            temperature: 0,
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: text },
            ],
          });

          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new LLMClientError(
              "Empty response from LLM",
              "INVALID_RESPONSE"
            );
          }

          const result = parseAndValidateLLMResponse(content);
          return {
            result,
            usage: {
              promptTokens: response.usage?.prompt_tokens ?? 0,
              completionTokens: response.usage?.completion_tokens ?? 0,
            },
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // 如果是 LLMClientError（解析/校验失败），直接抛出
          if (error instanceof LLMClientError) {
            throw error;
          }

          // 判断是否可重试
          const isTimeout = isTimeoutError(lastError);
          const isRateLimit = isRateLimitError(lastError);

          if (!isTimeout && !isRateLimit) {
            throw new LLMClientError(
              `LLM API error: ${lastError.message}`,
              "INVALID_RESPONSE",
              lastError
            );
          }

          // 最后一次重试失败
          if (attempt >= maxRetries) {
            throw new LLMClientError(
              `LLM API failed after ${maxRetries + 1} attempts: ${lastError.message}`,
              isTimeout ? "TIMEOUT" : "RATE_LIMIT",
              lastError
            );
          }

          // 等待后重试
          const delay = getDelay(attempt, isTimeout);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // 不应该到达这里，但 TypeScript 需要
      throw lastError || new LLMClientError("Unknown error", "INVALID_RESPONSE");
    },
  };
}

const DEEPSEEK_CONFIG = {
  model: "deepseek-v4-flash",
  baseURL: "https://api.deepseek.com/v1",
} as const;

const DOUBAO_CONFIG = {
  model: "doubao-seed-2-0-lite-260428",
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
} as const;

export function getLLMConfig(): LLMClientConfig {
  const provider = process.env.LLM_PROVIDER || "deepseek";

  if (provider === "doubao") {
    return {
      apiKey: process.env.DOUBAO_API_KEY || "",
      model: DOUBAO_CONFIG.model,
      baseURL: DOUBAO_CONFIG.baseURL,
    };
  }

  return {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    model: DEEPSEEK_CONFIG.model,
    baseURL: DEEPSEEK_CONFIG.baseURL,
  };
}
