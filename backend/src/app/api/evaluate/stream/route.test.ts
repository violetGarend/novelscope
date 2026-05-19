import { describe, it, expect } from "@jest/globals";
import { POST } from "./route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/evaluate/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readSSEStream(response: Response): Promise<string[]> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No readable stream");
  const decoder = new TextDecoder();
  const lines: string[] = [];
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      if (line.trim()) lines.push(line.trim());
    }
  }
  if (buffer.trim()) lines.push(buffer.trim());
  return lines;
}

describe("POST /api/evaluate/stream", () => {
  it("should return text/event-stream content type", async () => {
    const validText = "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。这一战，他彻底翻身逆袭。".repeat(4);
    const req = createRequest({ chapterText: validText });
    const res = await POST(req);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("should stream 7 progress events with correct step names", async () => {
    const validText = "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。这一战，他彻底翻身逆袭。".repeat(4);
    const req = createRequest({ chapterText: validText });
    const res = await POST(req);

    const lines = await readSSEStream(res);

    const progressLines = lines.filter((l) => l.includes('"type":"progress"'));
    expect(progressLines.length).toBe(7);

    const stepNames = progressLines.map((line) => {
      const data = JSON.parse(line.replace("data: ", ""));
      return data.stepName;
    });

    expect(stepNames).toEqual([
      "正在验证文本",
      "分析爽点密度",
      "分析节奏",
      "评估Hook强度",
      "评估章末悬念",
      "检查一致性",
      "生成报告",
    ]);
  });

  it("should end with a result event containing scores", async () => {
    const validText = "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。这一战，他彻底翻身逆袭。".repeat(4);
    const req = createRequest({ chapterText: validText });
    const res = await POST(req);

    const lines = await readSSEStream(res);

    const resultLine = lines.find((l) => l.includes('"type":"result"'));
    expect(resultLine).toBeDefined();
    const data = JSON.parse(resultLine!.replace("data: ", ""));
    expect(data).toHaveProperty("reportId");
    expect(data).toHaveProperty("scores");
    expect(data).toHaveProperty("isPartial");
  });

  it("should return 400 error for invalid text", async () => {
    const req = createRequest({ chapterText: "短" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
