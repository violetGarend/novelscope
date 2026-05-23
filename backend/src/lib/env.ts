import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DEEPSEEK_API_KEY: z.string().optional(),
  DOUBAO_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.enum(["deepseek", "doubao"]).default("deepseek"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${issues}`);
  }

  const config = result.data;

  // Validate the appropriate API key is set
  if (config.LLM_PROVIDER === "doubao") {
    if (!config.DOUBAO_API_KEY || config.DOUBAO_API_KEY.trim() === "") {
      throw new Error(
        "Environment validation failed:\n  - DOUBAO_API_KEY: required when LLM_PROVIDER is 'doubao'"
      );
    }
  } else {
    if (!config.DEEPSEEK_API_KEY || config.DEEPSEEK_API_KEY.trim() === "") {
      throw new Error(
        "Environment validation failed:\n  - DEEPSEEK_API_KEY: required when LLM_PROVIDER is 'deepseek' (or set LLM_PROVIDER=doubao)"
      );
    }
  }

  return config;
}
