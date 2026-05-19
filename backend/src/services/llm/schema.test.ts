import { describe, it, expect } from "@jest/globals";
import { LLMResultSchema, type LLMResult } from "./schema";

describe("LLMResultSchema", () => {
  it("should accept valid LLM result", () => {
    const validResult = {
      hookScore: 8,
      climaxScore: 7,
      cliffhangerScore: 7,
      pacingScore: 6,
      consistencyIssues: ["角色名称不一致"],
      highlights: ["开头引人入胜", "对话自然"],
      suggestions: ["可以增加更多冲突"],
    };
    const result = LLMResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hookScore).toBe(8);
      expect(result.data.cliffhangerScore).toBe(7);
    }
  });

  it("should reject hookScore out of range", () => {
    const invalidResult = {
      hookScore: 11, // 超出 0-10
      climaxScore: 7,
      cliffhangerScore: 7,
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };
    const result = LLMResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it("should reject negative scores", () => {
    const invalidResult = {
      hookScore: -1,
      climaxScore: 7,
      cliffhangerScore: 7,
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };
    const result = LLMResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it("should accept scores at boundaries (0 and 10)", () => {
    const boundaryResult = {
      hookScore: 0,
      climaxScore: 10,
      cliffhangerScore: 10,
      pacingScore: 0,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };
    const result = LLMResultSchema.safeParse(boundaryResult);
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const incompleteResult = {
      hookScore: 8,
      climaxScore: 7,
      // 缺少 cliffhangerScore
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };
    const result = LLMResultSchema.safeParse(incompleteResult);
    expect(result.success).toBe(false);
  });

  it("should accept empty arrays", () => {
    const resultWithEmptyArrays = {
      hookScore: 5,
      climaxScore: 5,
      cliffhangerScore: 5,
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };
    const result = LLMResultSchema.safeParse(resultWithEmptyArrays);
    expect(result.success).toBe(true);
  });

  it("should accept result with climaxScore and pacingScore", () => {
    const resultWithAllScores = {
      hookScore: 8,
      climaxScore: 7,
      cliffhangerScore: 6,
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };
    const result = LLMResultSchema.safeParse(resultWithAllScores);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.climaxScore).toBe(7);
      expect(result.data.pacingScore).toBe(5);
    }
  });

  it("should reject climaxScore out of range (>10)", () => {
    const invalidResult = {
      hookScore: 8,
      climaxScore: 11,
      cliffhangerScore: 7,
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };
    const result = LLMResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it("should reject pacingScore out of range (<0)", () => {
    const invalidResult = {
      hookScore: 8,
      climaxScore: 7,
      cliffhangerScore: 6,
      pacingScore: -1,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };
    const result = LLMResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it("should reject missing climaxScore", () => {
    const invalidResult = {
      hookScore: 8,
      cliffhangerScore: 6,
      pacingScore: 5,
      consistencyIssues: [],
      highlights: [],
      suggestions: [],
    };
    const result = LLMResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it("should accept result with multiple issues and suggestions", () => {
    const resultWithMultiple = {
      hookScore: 3,
      climaxScore: 6,
      cliffhangerScore: 4,
      pacingScore: 5,
      consistencyIssues: [
        "第2章角色名错误",
        "时间线矛盾",
        "地点描述不一致",
      ],
      highlights: ["文笔流畅"],
      suggestions: [
        "增加开头悬念",
        "优化对话节奏",
        "加强结尾钩子",
      ],
    };
    const result = LLMResultSchema.safeParse(resultWithMultiple);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.consistencyIssues).toHaveLength(3);
      expect(result.data.suggestions).toHaveLength(3);
    }
  });
});
