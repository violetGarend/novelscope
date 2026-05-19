import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { validateChapterText } from "./validate";
import { POST } from "./route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("validateChapterText", () => {
  it("should reject null/undefined/empty", () => {
    expect(validateChapterText(null as any).valid).toBe(false);
    expect(validateChapterText(undefined as any).valid).toBe(false);
    expect(validateChapterText("").valid).toBe(false);
  });

  it("should reject text shorter than 100 characters", () => {
    const shortText = "这是一段短文本。";
    const result = validateChapterText(shortText);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.message).toContain("100");
  });

  it("should reject text longer than 50000 characters", () => {
    const longText = "字".repeat(50001);
    const result = validateChapterText(longText);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.message).toContain("过长");
  });

  it("should reject non-Chinese text", () => {
    const englishText = "This is an English text that is long enough to pass the length check but should fail the language validation. ".repeat(5);
    const result = validateChapterText(englishText);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.message).toContain("中文");
  });

  it("should accept valid Chinese text", () => {
    const validText = "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。".repeat(5);
    const result = validateChapterText(validText);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should accept text at exact boundaries (100 chars)", () => {
    const boundaryText = "字".repeat(100);
    const result = validateChapterText(boundaryText);
    expect(result.valid).toBe(true);
  });

  it("should accept text at exact boundaries (50000 chars)", () => {
    const boundaryText = "字".repeat(50000);
    const result = validateChapterText(boundaryText);
    expect(result.valid).toBe(true);
  });
});

describe("POST /api/evaluate", () => {
  it("should return 400 for empty body", async () => {
    const req = createRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for short text", async () => {
    const req = createRequest({ chapterText: "短文本" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 200 with evaluation result for valid text", async () => {
    const validText = "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。这一战，他彻底翻身逆袭，从此踏上巅峰之路。热血沸腾的战斗，让所有人都震撼不已。他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。这一战，他彻底翻身逆袭，从此踏上巅峰之路。热血沸腾的战斗，让所有人都震撼不已。";
    const req = createRequest({ chapterText: validText });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("reportId");
    expect(data).toHaveProperty("scores");
    expect(data).toHaveProperty("isPartial");
  });
});
