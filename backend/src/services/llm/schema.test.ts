import { describe, it, expect } from "@jest/globals";
import { LLMResultSchema } from "./schema";

describe("LLMResultSchema", () => {
  it("should accept valid LLM result", () => {
    const validResult = {
      hookScore: 8,
      climaxScore: 7,
      cliffhangerScore: 7,
      pacingScore: 6,
      consistencyIssues: ["角色名称不一致"],
      highlights: ["开头引人入胜", "对话自然"],
      suggestions: [
        { severity: "warning", location: "中段", issue: "可以增加更多冲突", direction: "引入对立角色或利益冲突点" },
      ],
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
        { severity: "critical", location: "开头300字", issue: "增加开头悬念", direction: "在开头埋设未解之谜或冲突暗示" },
        { severity: "warning", location: "中段对话", issue: "优化对话节奏", direction: "精简重复信息，加快对话交换速度" },
        { severity: "info", location: "结尾", issue: "加强结尾钩子", direction: "在章末增加悬念或未完成的冲突" },
      ],
    };
    const result = LLMResultSchema.safeParse(resultWithMultiple);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.consistencyIssues).toHaveLength(3);
      expect(result.data.suggestions).toHaveLength(3);
      if (result.success) {
        expect(result.data.suggestions[0]).toMatchObject({
          severity: "critical",
          location: "开头300字",
          issue: "增加开头悬念",
          direction: "在开头埋设未解之谜或冲突暗示",
        });
        expect(result.data.suggestions[1].severity).toBe("warning");
        expect(result.data.suggestions[2].severity).toBe("info");
      }
    }
  });

  describe("suggestions backward compatibility", () => {
    it("should accept old string[] format and transform to structured format", () => {
      const oldFormat = {
        hookScore: 7,
        climaxScore: 6,
        cliffhangerScore: 5,
        pacingScore: 5,
        consistencyIssues: [],
        highlights: [],
        suggestions: ["建议1", "建议2", "建议3"],
      };
      const result = LLMResultSchema.safeParse(oldFormat);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toHaveLength(3);
        for (const s of result.data.suggestions) {
          expect(s.severity).toBe("info");
          expect(s.location).toBe("");
          expect(s.direction).toBe("");
          expect(typeof s.issue).toBe("string");
        }
        expect(result.data.suggestions[0].issue).toBe("建议1");
        expect(result.data.suggestions[2].issue).toBe("建议3");
      }
    });

    it("should accept empty old format suggestion array", () => {
      const oldFormatEmpty = {
        hookScore: 5,
        climaxScore: 5,
        cliffhangerScore: 5,
        pacingScore: 5,
        consistencyIssues: [],
        highlights: [],
        suggestions: [],
      };
      const result = LLMResultSchema.safeParse(oldFormatEmpty);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.suggestions).toHaveLength(0);
      }
    });

    it("should reject suggestions with invalid severity", () => {
      const invalidSeverity = {
        hookScore: 5,
        climaxScore: 5,
        cliffhangerScore: 5,
        pacingScore: 5,
        consistencyIssues: [],
        highlights: [],
        suggestions: [{ severity: "urgent", location: "", issue: "test", direction: "" }],
      };
      const result = LLMResultSchema.safeParse(invalidSeverity);
      expect(result.success).toBe(false);
    });

    it("should accept suggestions sorted by severity (critical first)", () => {
      const sortedBySeverity = {
        hookScore: 6,
        climaxScore: 6,
        cliffhangerScore: 6,
        pacingScore: 6,
        consistencyIssues: [],
        highlights: [],
        suggestions: [
          { severity: "info", location: "a", issue: "info item", direction: "d" },
          { severity: "critical", location: "b", issue: "critical item", direction: "d" },
          { severity: "warning", location: "c", issue: "warning item", direction: "d" },
        ],
      };
      const result = LLMResultSchema.safeParse(sortedBySeverity);
      expect(result.success).toBe(true);
    });
  });
});
