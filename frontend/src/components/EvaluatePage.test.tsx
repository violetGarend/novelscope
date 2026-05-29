import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvaluatePage } from "./EvaluatePage";
import { getRandomTestChapter } from "../test-utils/chapterLoader";

// Mock localStorage
const storage = new Map<string, string>();
beforeEach(() => {
  storage.clear();
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => storage.get(String(key)) ?? null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => storage.set(String(key), String(value)));
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => { storage.delete(String(key)); });
});

function createSSEMockStream(events: object[]) {
  const encoder = new TextEncoder();
  const chunks = events.map((e) => encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
  let chunkIndex = 0;

  return new ReadableStream({
    pull(controller) {
      if (chunkIndex < chunks.length) {
        controller.enqueue(chunks[chunkIndex]);
        chunkIndex++;
      } else {
        controller.close();
      }
    },
  });
}

describe("EvaluatePage", () => {

  it("should render text input and submit button initially", () => {
    render(<EvaluatePage />);
    expect(screen.getByPlaceholderText(/输入章节文本/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /开始评估/i })).toBeInTheDocument();
  });

  it("should not show progress bar initially", () => {
    render(<EvaluatePage />);
    // ProgressBar renders <ol> with step items; no "步骤" text should appear in idle phase
    expect(screen.queryByText(/步骤/)).toBeNull();
    // ProgressBar's <ol> has class starting with "space-y-2" and contains step items
    const lists = screen.queryAllByRole("list");
    const progressBars = lists.filter((el) => el.tagName === "OL");
    expect(progressBars).toHaveLength(0);
  });

  it("should show progress bar and hide form when evaluation starts", async () => {
    const user = userEvent.setup();
    // Only send progress events (no result) to stay in evaluating phase
    const stream = createSSEMockStream([
      { type: "progress", step: 1, stepName: "正在验证文本" },
      { type: "progress", step: 2, stepName: "分析爽点密度" },
      { type: "progress", step: 3, stepName: "分析节奏" },
    ]);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      })
    );

    render(<EvaluatePage />);

    const textarea = screen.getByPlaceholderText(/输入章节文本/i);
    fireEvent.change(textarea, { target: { value: getRandomTestChapter() } });
    await user.click(screen.getByRole("button", { name: /开始评估/i }));

    // Progress bar should appear (identifiable by its step text), form should disappear
    await waitFor(() => {
      expect(screen.getByText(/步骤/)).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText(/输入章节文本/i)).toBeNull();
  });

  it("should show ReportCard with full report after evaluation finishes", async () => {
    const user = userEvent.setup();
    const resultPayload = {
      type: "result",
      reportId: "test_1",
      scores: {
        hookScore: 8,
        climaxScore: 7,
        cliffhangerScore: 6,
        pacingScore: 5,
      },
      climaxResult: {
        score: 7,
        matchedKeywords: ["打脸"],
        keywordCategories: { reversal: ["打脸"], shock: [], breakthrough: [], conflict: [], emotion: [] },
        dialogueDensity: 0.5,
        conflictDensity: 0.3,
      },
      pacingResult: {
        score: 5,
        curve: [{ paragraph: 1, tension: 5, type: "dialogue" }],
        cv: 0.45,
        typeRatio: { action: 0.1, dialogue: 0.6, description: 0.3 },
      },
      fillerResult: { items: [], suspiciousPairs: [] },
      llmResult: {
        hookScore: 8,
        climaxScore: 7,
        cliffhangerScore: 6,
        pacingScore: 5,
        consistencyIssues: [],
        highlights: ["开头冲突感强"],
        suggestions: [
          { severity: "warning", location: "中段", issue: "中间段落可以更紧凑", direction: "减少重复" },
        ],
      },
      isPartial: false,
    };

    const stream = createSSEMockStream([
      { type: "progress", step: 1, stepName: "正在验证文本" },
      { type: "progress", step: 2, stepName: "分析爽点密度" },
      { type: "progress", step: 3, stepName: "分析节奏" },
      { type: "progress", step: 4, stepName: "评估Hook强度" },
      { type: "progress", step: 5, stepName: "评估章末悬念" },
      { type: "progress", step: 6, stepName: "检查一致性" },
      { type: "progress", step: 7, stepName: "生成报告" },
      resultPayload,
    ]);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      })
    );

    render(<EvaluatePage />);

    const textarea = screen.getByPlaceholderText(/输入章节文本/i);
    fireEvent.change(textarea, { target: { value: getRandomTestChapter() } });
    await user.click(screen.getByRole("button", { name: /开始评估/i }));

    // ReportCard should appear with scores and highlights
    await waitFor(() => {
      expect(screen.getByText("评估报告")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("四维雷达图")).toBeInTheDocument();
    expect(screen.getByText("亮点分析")).toBeInTheDocument();
    expect(screen.getByText("开头冲突感强")).toBeInTheDocument();
  });

  it("should show ErrorReport with retry button when fetch fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<EvaluatePage />);

    const textarea = screen.getByPlaceholderText(/输入章节文本/i);
    fireEvent.change(textarea, { target: { value: getRandomTestChapter() } });
    await user.click(screen.getByRole("button", { name: /开始评估/i }));

    await waitFor(() => {
      expect(screen.getByText(/评估失败/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /重试/i })).toBeInTheDocument();
    });
  });

  it("should show progress bar immediately when evaluation starts", async () => {
    const user = userEvent.setup();
    // Create a stream that delays the first event
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode("")); // empty chunk
      },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      })
    );

    render(<EvaluatePage />);

    const textarea = screen.getByPlaceholderText(/输入章节文本/i);
    fireEvent.change(textarea, { target: { value: getRandomTestChapter() } });
    await user.click(screen.getByRole("button", { name: /开始评估/i }));

    // ProgressBar should appear immediately with step text (animation drives display)
    expect(screen.getByText(/步骤/)).toBeInTheDocument();
  });

  it("should show evaluation guide and writing tips in right panel", () => {
    render(<EvaluatePage />);
    // Evaluation guide
    expect(screen.getByText("评估指南")).toBeInTheDocument();
    expect(screen.getByText(/至少输入 1,000 字/)).toBeInTheDocument();
    expect(screen.getByText(/建议粘贴完整的章节段落/)).toBeInTheDocument();
    // Writing tips
    expect(screen.getByText("写作小贴士")).toBeInTheDocument();
    expect(screen.getByText(/黄金三章/)).toBeInTheDocument();
    expect(screen.getByText(/爽点节奏/)).toBeInTheDocument();
  });

  it("should show quick sample buttons below input card", () => {
    render(<EvaluatePage />);
    expect(screen.getByText("快速试试：")).toBeInTheDocument();
    // Only sample buttons, not history entries
    const buttons = screen.getAllByRole("button");
    const sampleButtons = buttons.filter((b) =>
      b.textContent?.includes("（")
    );
    expect(sampleButtons).toHaveLength(3);
  });

  it("should fill textarea when sample button is clicked", async () => {
    const user = userEvent.setup();
    render(<EvaluatePage />);

    const textarea = screen.getByPlaceholderText(/输入章节文本/i);
    expect(textarea).toHaveValue("");

    const allButtons = screen.getAllByRole("button");
    const ch1Button = allButtons.find((b) => b.textContent?.includes("第1章（荒年）"))!;
    await user.click(ch1Button);

    expect(textarea).not.toHaveValue("");
    expect(Number(screen.getByTestId("char-count").textContent)).toBeGreaterThan(100);
  });

  it("should disable submit button when text is too short", async () => {
    render(<EvaluatePage />);
    const button = screen.getByRole("button", { name: /开始评估/i });
    expect(button).toBeDisabled();
  });

  it("should display character count and update on input", () => {
    render(<EvaluatePage />);
    // Initial state: 0 字
    expect(screen.getByTestId("char-count")).toHaveTextContent("0");

    const textarea = screen.getByPlaceholderText(/输入章节文本/i);
    fireEvent.change(textarea, { target: { value: "测试文本内容" } });

    expect(screen.getByTestId("char-count")).toHaveTextContent("6");
  });
});
