import type { TokenUsage } from "@/services/llm";

const DEEPSEEK_INPUT_PRICE_PER_1M = 1;   // ¥1/百万输入 token
const DEEPSEEK_OUTPUT_PRICE_PER_1M = 2;  // ¥2/百万输出 token

const DOUBAO_INPUT_PRICE_PER_1M = 0.8;   // ¥0.8/百万输入 token (Lite)
const DOUBAO_OUTPUT_PRICE_PER_1M = 2;    // ¥2/百万输出 token (Lite)

export function calculateCost(usage: TokenUsage, model?: string): number {
  const isDoubao = model?.startsWith("doubao-");
  const inputPrice = isDoubao ? DOUBAO_INPUT_PRICE_PER_1M : DEEPSEEK_INPUT_PRICE_PER_1M;
  const outputPrice = isDoubao ? DOUBAO_OUTPUT_PRICE_PER_1M : DEEPSEEK_OUTPUT_PRICE_PER_1M;

  const inputCost = (usage.promptTokens / 1_000_000) * inputPrice;
  const outputCost = (usage.completionTokens / 1_000_000) * outputPrice;
  return inputCost + outputCost;
}
