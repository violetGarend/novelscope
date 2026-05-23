import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.DATABASE_URL;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DOUBAO_API_KEY;
    delete process.env.LLM_PROVIDER;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should throw when DATABASE_URL is missing", () => {
    expect(() => validateEnv()).toThrow(/DATABASE_URL/);
  });

  it("should pass when DATABASE_URL is set and DEEPSEEK_API_KEY is set", () => {
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.DEEPSEEK_API_KEY = "sk-test";
    const config = validateEnv();
    expect(config.DATABASE_URL).toBe("postgresql://localhost/test");
  });

  it("should throw when neither DEEPSEEK_API_KEY nor DOUBAO_API_KEY is set", () => {
    process.env.DATABASE_URL = "postgresql://localhost/test";
    expect(() => validateEnv()).toThrow(/DEEPSEEK_API_KEY/);
  });

  it("should accept DOUBAO_API_KEY when LLM_PROVIDER is doubao", () => {
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.LLM_PROVIDER = "doubao";
    process.env.DOUBAO_API_KEY = "ark-test";
    const config = validateEnv();
    expect(config.LLM_PROVIDER).toBe("doubao");
    expect(config.DOUBAO_API_KEY).toBe("ark-test");
  });

  it("should throw when LLM_PROVIDER is doubao but DOUBAO_API_KEY is missing", () => {
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.LLM_PROVIDER = "doubao";
    expect(() => validateEnv()).toThrow(/DOUBAO_API_KEY/);
  });

  it("should return all validated fields", () => {
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.DEEPSEEK_API_KEY = "sk-test";
    process.env.LLM_PROVIDER = "deepseek";
    const config = validateEnv();
    expect(config).toEqual({
      DATABASE_URL: "postgresql://localhost/test",
      DEEPSEEK_API_KEY: "sk-test",
      DOUBAO_API_KEY: undefined,
      LLM_PROVIDER: "deepseek",
    });
  });
});
