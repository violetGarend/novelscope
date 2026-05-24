import { describe, it, expect } from "@jest/globals";
import { POST } from "./route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/test/pacing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/test/pacing", () => {
  it("should return 400 for empty text", async () => {
    const res = await POST(createRequest({ text: "" }));
    expect(res.status).toBe(400);
  });

  it("should return 200 with pacing result", async () => {
    const text = [
      "他猛地拔出长剑，朝着敌人劈了过去。",
      "「你来了。」「是的，我来了。」",
      "远处的山峦在夕阳下显得格外宁静。",
    ].join("\n\n");
    const res = await POST(createRequest({ text }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("curve");
    expect(data).toHaveProperty("cv");
    expect(data).toHaveProperty("typeRatio");
    expect(data.curve.length).toBeGreaterThan(0);
  });
});
