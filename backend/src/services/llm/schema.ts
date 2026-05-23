import { z } from "zod";

export const SuggestionItemSchema = z.object({
  severity: z.enum(["critical", "warning", "info"]),
  location: z.string(),
  issue: z.string(),
  direction: z.string(),
});

export type SuggestionItem = z.infer<typeof SuggestionItemSchema>;

/** 向后兼容：接受旧格式 string[]，自动转换为新格式 */
const SuggestionsSchema = z.array(SuggestionItemSchema).or(
  z.array(z.string()).transform((arr) =>
    arr.map((s) => ({
      severity: "info" as const,
      location: "",
      issue: s,
      direction: "",
    }))
  )
);

export const LLMResultSchema = z.object({
  hookScore: z.number().min(0).max(10),
  climaxScore: z.number().min(0).max(10),
  cliffhangerScore: z.number().min(0).max(10),
  pacingScore: z.number().min(0).max(10),
  consistencyIssues: z.array(z.string()),
  highlights: z.array(z.string()),
  suggestions: SuggestionsSchema,
});

export type LLMResult = z.infer<typeof LLMResultSchema>;
