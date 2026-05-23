import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createLLMClient, LLMClientError, getLLMConfig } from "./client";
import type { LLMCallResult } from "./client";
import type { LLMResult } from "./schema";

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe("LLMClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call API with temperature=0", async () => {
    const validResponse: LLMResult = {
      hookScore: 8,
      climaxScore: 7,
      cliffhangerScore: 7,
      pacingScore: 6,
      consistencyIssues: [],
      highlights: ["开头好"],
      suggestions: [],
    };

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(validResponse),
          },
        },
      ],
      usage: { prompt_tokens: 150, completion_tokens: 80, total_tokens: 230 },
    });

    const client = createLLMClient({ apiKey: "test-key", model: "test-model" });
    await client.evaluateWithLLM("测试文本", "测试prompt");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0,
      })
    );
  });

  it("should strip markdown fences before parsing JSON", async () => {
    const validResponse: LLMResult = {
      hookScore: 8,
      climaxScore: 7,
      cliffhangerScore: 7,
      pacingScore: 6,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };

    // 返回带 markdown fence 的响应
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "```json\n" + JSON.stringify(validResponse) + "\n```",
          },
        },
      ],
      usage: { prompt_tokens: 150, completion_tokens: 80, total_tokens: 230 },
    });

    const client = createLLMClient({ apiKey: "test-key", model: "test-model" });
    const { result } = await client.evaluateWithLLM("测试文本", "测试prompt");

    expect(result.hookScore).toBe(8);
  });

  it("should retry on timeout", async () => {
    const validResponse: LLMResult = {
      hookScore: 5,
      climaxScore: 5,
      cliffhangerScore: 5,
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };

    // 第一次超时，第二次成功
    mockCreate
      .mockRejectedValueOnce(new Error("Request timed out"))
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(validResponse),
            },
          },
        ],
        usage: { prompt_tokens: 150, completion_tokens: 80, total_tokens: 230 },
      });

    const client = createLLMClient({ apiKey: "test-key", model: "test-model" });
    const { result } = await client.evaluateWithLLM("测试文本", "测试prompt");

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.hookScore).toBe(5);
  });

  it("should retry on 429 rate limit error", async () => {
    const validResponse: LLMResult = {
      hookScore: 6,
      climaxScore: 6,
      cliffhangerScore: 6,
      pacingScore: 6,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };

    const rateLimitError = new Error("Rate limit exceeded") as any;
    rateLimitError.status = 429;

    mockCreate
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(validResponse),
            },
          },
        ],
        usage: { prompt_tokens: 150, completion_tokens: 80, total_tokens: 230 },
      });

    const client = createLLMClient({ apiKey: "test-key", model: "test-model" });
    const { result } = await client.evaluateWithLLM("测试文本", "测试prompt");

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.hookScore).toBe(6);
  });

  it("should throw LLMClientError after max retries", async () => {
    mockCreate.mockRejectedValue(new Error("Request timed out"));

    const client = createLLMClient({ apiKey: "test-key", model: "test-model" });

    await expect(
      client.evaluateWithLLM("测试文本", "测试prompt")
    ).rejects.toThrow(LLMClientError);

    // 初始调用 + 1次重试 = 2次
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("should throw on invalid JSON response", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "这不是JSON",
          },
        },
      ],
    });

    const client = createLLMClient({ apiKey: "test-key", model: "test-model" });

    await expect(
      client.evaluateWithLLM("测试文本", "测试prompt")
    ).rejects.toThrow(LLMClientError);
  });

  it("should throw on invalid schema (score out of range)", async () => {
    const invalidResponse = {
      hookScore: 15, // 超出范围
      cliffhangerScore: 7,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(invalidResponse),
          },
        },
      ],
    });

    const client = createLLMClient({ apiKey: "test-key", model: "test-model" });

    await expect(
      client.evaluateWithLLM("测试文本", "测试prompt")
    ).rejects.toThrow(LLMClientError);
  });

  it("should read API key from constructor parameter", () => {
    const OpenAI = require("openai").default;
    createLLMClient({ apiKey: "my-api-key", model: "test-model" });

    expect(OpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "my-api-key",
        baseURL: expect.stringContaining("deepseek"),
      })
    );
  });

  it("should configure timeout on OpenAI client (default 45s)", () => {
    const OpenAI = require("openai").default;
    createLLMClient({ apiKey: "test-key", model: "test-model" });

    expect(OpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 45000,
      })
    );
  });

  it("should allow custom timeout override", () => {
    const OpenAI = require("openai").default;
    createLLMClient({ apiKey: "test-key", model: "test-model", timeout: 30000 });

    expect(OpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 30000,
      })
    );
  });

  it("should extract and return token usage from API response", async () => {
    const validResponse: LLMResult = {
      hookScore: 7,
      climaxScore: 7,
      cliffhangerScore: 7,
      pacingScore: 7,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(validResponse),
          },
        },
      ],
      usage: { prompt_tokens: 1200, completion_tokens: 350, total_tokens: 1550 },
    });

    const client = createLLMClient({ apiKey: "test-key", model: "test-model" });
    const callResult = await client.evaluateWithLLM("测试文本", "测试prompt");

    expect(callResult.result).toBeDefined();
    expect(callResult.result.hookScore).toBe(7);
    expect(callResult.usage).toEqual({
      promptTokens: 1200,
      completionTokens: 350,
    });
  });
});

describe("getLLMConfig", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.LLM_PROVIDER;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DOUBAO_API_KEY;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should return DeepSeek config by default", () => {
    process.env.DEEPSEEK_API_KEY = "sk-test";
    const config = getLLMConfig();
    expect(config.model).toBe("deepseek-v4-flash");
    expect(config.baseURL).toBe("https://api.deepseek.com/v1");
    expect(config.apiKey).toBe("sk-test");
  });

  it("should return Doubao config when LLM_PROVIDER=doubao", () => {
    process.env.LLM_PROVIDER = "doubao";
    process.env.DOUBAO_API_KEY = "ark-test";
    const config = getLLMConfig();
    expect(config.model).toBe("doubao-seed-2-0-lite-260428");
    expect(config.baseURL).toBe("https://ark.cn-beijing.volces.com/api/v3");
    expect(config.apiKey).toBe("ark-test");
  });

  it("should return empty apiKey when env var not set", () => {
    const config = getLLMConfig();
    expect(config.apiKey).toBe("");
  });

  it("should return empty apiKey for doubao when DOUBAO_API_KEY not set", () => {
    process.env.LLM_PROVIDER = "doubao";
    const config = getLLMConfig();
    expect(config.apiKey).toBe("");
    expect(config.model).toBe("doubao-seed-2-0-lite-260428");
  });
});
