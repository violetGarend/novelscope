import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvaluatePage } from "./EvaluatePage";

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
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render text input and submit button initially", () => {
    render(<EvaluatePage />);
    expect(screen.getByPlaceholderText(/输入章节文本/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /开始评估/i })).toBeInTheDocument();
  });

  it("should not show progress bar initially", () => {
    render(<EvaluatePage />);
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("should show progress bar and hide form when evaluation starts", async () => {
    const user = userEvent.setup();
    const stream = createSSEMockStream([
      { type: "progress", step: 1, stepName: "正在验证文本" },
      { type: "progress", step: 2, stepName: "分析爽点密度" },
      { type: "progress", step: 3, stepName: "分析节奏" },
      { type: "progress", step: 4, stepName: "评估Hook强度" },
      { type: "progress", step: 5, stepName: "评估章末悬念" },
      { type: "progress", step: 6, stepName: "检查一致性" },
      { type: "progress", step: 7, stepName: "生成报告" },
      { type: "result", reportId: "test_1", scores: { overallScore: 7 }, isPartial: false },
    ]);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      })
    );

    render(<EvaluatePage />);

    const textarea = screen.getByPlaceholderText(/输入章节文本/i);
    await user.type(textarea, "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。这一战，他彻底翻身逆袭。".repeat(4));
    await user.click(screen.getByRole("button", { name: /开始评估/i }));

    // Progress bar should appear, form should disappear
    await waitFor(() => {
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText(/输入章节文本/i)).toBeNull();
  });

  it("should show completed progress when evaluation finishes", async () => {
    const user = userEvent.setup();
    const stream = createSSEMockStream([
      { type: "progress", step: 1, stepName: "正在验证文本" },
      { type: "progress", step: 2, stepName: "分析爽点密度" },
      { type: "progress", step: 3, stepName: "分析节奏" },
      { type: "progress", step: 4, stepName: "评估Hook强度" },
      { type: "progress", step: 5, stepName: "评估章末悬念" },
      { type: "progress", step: 6, stepName: "检查一致性" },
      { type: "progress", step: 7, stepName: "生成报告" },
      { type: "result", reportId: "test_1", scores: { overallScore: 7 }, isPartial: false },
    ]);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      })
    );

    render(<EvaluatePage />);

    const textarea = screen.getByPlaceholderText(/输入章节文本/i);
    await user.type(textarea, "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。这一战，他彻底翻身逆袭。".repeat(4));
    await user.click(screen.getByRole("button", { name: /开始评估/i }));

    // All steps should be completed eventually
    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      items.forEach((item) => {
        expect(item.getAttribute("data-state")).toBe("completed");
      });
    });
  });

  it("should show error message when fetch fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<EvaluatePage />);

    const textarea = screen.getByPlaceholderText(/输入章节文本/i);
    await user.type(textarea, "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。这一战，他彻底翻身逆袭。".repeat(4));
    await user.click(screen.getByRole("button", { name: /开始评估/i }));

    await waitFor(() => {
      expect(screen.getByText(/评估失败/i)).toBeInTheDocument();
    });
  });

  it("should show skeleton placeholder while waiting for first progress event", async () => {
    const user = userEvent.setup();
    // Create a stream that delays the first event
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Small delay to ensure the skeleton state is observable
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
    await user.type(textarea, "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。这一战，他彻底翻身逆袭。".repeat(4));
    await user.click(screen.getByRole("button", { name: /开始评估/i }));

    // Skeleton should be visible while currentStep is 0
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("should disable submit button when text is too short", async () => {
    render(<EvaluatePage />);
    const button = screen.getByRole("button", { name: /开始评估/i });
    expect(button).toBeDisabled();
  });
});
