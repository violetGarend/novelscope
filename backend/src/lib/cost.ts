import type { TokenUsage } from "@/services/llm";

const DEEPSEEK_INPUT_PRICE_PER_1M = 1;   // ¥1/百万输入 token
const DEEPSEEK_OUTPUT_PRICE_PER_1M = 2;  // ¥2/百万输出 token

export function calculateCost(usage: TokenUsage): number {
  const inputCost = (usage.promptTokens / 1_000_000) * DEEPSEEK_INPUT_PRICE_PER_1M;
  const outputCost = (usage.completionTokens / 1_000_000) * DEEPSEEK_OUTPUT_PRICE_PER_1M;
  return inputCost + outputCost;
}
