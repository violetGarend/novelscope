import { z } from "zod";

export const LLMResultSchema = z.object({
  hookScore: z.number().min(0).max(10),
  climaxScore: z.number().min(0).max(10),
  cliffhangerScore: z.number().min(0).max(10),
  pacingScore: z.number().min(0).max(10),
  consistencyIssues: z.array(z.string()),
  highlights: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type LLMResult = z.infer<typeof LLMResultSchema>;
