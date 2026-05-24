import { describe, it, expect } from "@jest/globals";
import { POST } from "./route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/test/climax", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/test/climax", () => {
  it("should return 400 for empty text", async () => {
    const req = createRequest({ text: "" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 200 with analysis result for valid text", async () => {
    const text =
      "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。" +
      "这一战，他彻底翻身逆袭，从此踏上巅峰之路。热血沸腾的战斗，让所有人都震撼不已。";
    const req = createRequest({ text });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("matchedKeywords");
    expect(data).toHaveProperty("dialogueDensity");
    expect(data).toHaveProperty("conflictDensity");
    expect(data.matchedKeywords.length).toBeGreaterThan(0);
  });
});
