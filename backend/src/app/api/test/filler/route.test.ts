import { describe, it, expect } from "@jest/globals";
import { POST } from "./route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/test/filler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/test/filler", () => {
  it("should return 400 for empty text", async () => {
    const res = await POST(createRequest({ text: "" }));
    expect(res.status).toBe(400);
  });

  it("should return 200 with filler result", async () => {
    const text = [
      "他走在路上，看着远方的山峦，心中感慨万千。",
      "他走在路上，望着远方的山峦，心中感慨万千。",
      "今天的天气非常好，阳光明媚。",
    ].join("\n\n");
    const res = await POST(createRequest({ text }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
  });
});
