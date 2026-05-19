import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createLLMClient, LLMClientError } from "./client";
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
    });

    const client = createLLMClient({ apiKey: "test-key" });
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
    });

    const client = createLLMClient({ apiKey: "test-key" });
    const result = await client.evaluateWithLLM("测试文本", "测试prompt");

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
      });

    const client = createLLMClient({ apiKey: "test-key" });
    const result = await client.evaluateWithLLM("测试文本", "测试prompt");

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
      });

    const client = createLLMClient({ apiKey: "test-key" });
    const result = await client.evaluateWithLLM("测试文本", "测试prompt");

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.hookScore).toBe(6);
  });

  it("should throw LLMClientError after max retries", async () => {
    mockCreate.mockRejectedValue(new Error("Request timed out"));

    const client = createLLMClient({ apiKey: "test-key" });

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

    const client = createLLMClient({ apiKey: "test-key" });

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

    const client = createLLMClient({ apiKey: "test-key" });

    await expect(
      client.evaluateWithLLM("测试文本", "测试prompt")
    ).rejects.toThrow(LLMClientError);
  });

  it("should read API key from constructor parameter", () => {
    const OpenAI = require("openai").default;
    createLLMClient({ apiKey: "my-api-key" });

    expect(OpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "my-api-key",
        baseURL: expect.stringContaining("deepseek"),
      })
    );
  });
});
