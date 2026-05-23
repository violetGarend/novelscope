import { describe, it, expect } from "@jest/globals";
import { validateChapterText } from "./validate";
import { POST } from "./route";
import { getRandomTestChapter } from "../../../test-utils/chapterLoader";

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("validateChapterText", () => {
  it("should reject null/undefined/empty", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateChapterText(null as any).valid).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateChapterText(undefined as any).valid).toBe(false);
    expect(validateChapterText("").valid).toBe(false);
  });

  it("should reject text shorter than 1000 characters", () => {
    const shortText = "这是一段短文本。";
    const result = validateChapterText(shortText);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.message).toContain("1000");
  });

  it("should reject text longer than 50000 characters", () => {
    const longText = "字".repeat(50001);
    const result = validateChapterText(longText);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.message).toContain("过长");
  });

  it("should reject non-Chinese text", () => {
    const englishText = "This is an English text that is long enough to pass the length check but should fail the language validation. ".repeat(12);
    const result = validateChapterText(englishText);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.message).toContain("中文");
  });

  it("should accept valid Chinese text", () => {
    const validText = getRandomTestChapter();
    const result = validateChapterText(validText);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should accept text at exact boundaries (1000 chars)", () => {
    const boundaryText = "字".repeat(1000);
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
    const validText = getRandomTestChapter();
    const req = createRequest({ chapterText: validText });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("reportId");
    expect(data).toHaveProperty("scores");
    expect(data).toHaveProperty("isPartial");
  });
});
