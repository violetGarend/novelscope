import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar, EVALUATION_STEPS, PRE_STEPS, POST_STEPS } from "./ProgressBar";

describe("ProgressBar", () => {
  it("should render all 7 steps", () => {
    render(<ProgressBar currentStep={0} />);
    EVALUATION_STEPS.forEach((step) => {
      expect(screen.getByText(step.stepName)).toBeInTheDocument();
    });
  });

  it("should mark steps before currentStep as completed", () => {
    render(<ProgressBar currentStep={3} />);
    // Steps 1-2 should be completed
    const step1 = screen.getByText("正在验证文本").closest("li");
    const step2 = screen.getByText("分析爽点密度").closest("li");
    const step3 = screen.getByText("分析节奏").closest("li");
    const step4 = screen.getByText("构建 AI 提示…").closest("li");

    expect(step1?.getAttribute("data-state")).toBe("completed");
    expect(step2?.getAttribute("data-state")).toBe("completed");
    expect(step3?.getAttribute("data-state")).toBe("active");
    expect(step4?.getAttribute("data-state")).toBe("pending");
  });

  it("should show check icon for completed steps", () => {
    render(<ProgressBar currentStep={5} />);
    const completedItems = screen.getAllByRole("listitem").filter(
      (item) => item.getAttribute("data-state") === "completed"
    );
    expect(completedItems.length).toBe(6); // pre-steps 2 + real steps 1-4
  });

  it("should highlight the current step with primary color", () => {
    render(<ProgressBar currentStep={4} />);
    const activeItem = screen
      .getAllByRole("listitem")
      .find((item) => item.getAttribute("data-state") === "active");
    expect(activeItem).toBeDefined();
    expect(activeItem?.textContent).toContain("构建 AI 提示");
  });

  it("should show warm-up pre-step as active when currentStep is 0", () => {
    render(<ProgressBar currentStep={0} />);
    const items = screen.getAllByRole("listitem");
    // Pre-step -1 is active, rest are pending (9 items: 2 pre + 7 real)
    expect(items.length).toBe(9);
    const active = items.filter((i) => i.getAttribute("data-state") === "active");
    const pending = items.filter((i) => i.getAttribute("data-state") === "pending");
    expect(active.length).toBe(1);
    expect(pending.length).toBe(8);
    expect(active[0]?.textContent).toContain("加载分析模型");
  });

  it("should show step 7 as active when currentStep is 7", () => {
    render(<ProgressBar currentStep={7} />);
    const items = screen.getAllByRole("listitem");
    // Pre 2 + real 1-6 = 8 completed, real 7 + post 8 = 2 active, post 9 = 1 pending
    const completed = items.filter((i) => i.getAttribute("data-state") === "completed");
    const active = items.filter((i) => i.getAttribute("data-state") === "active");
    expect(completed.length).toBe(8);
    expect(active.length).toBe(2);
    expect(active[0]?.textContent).toContain("生成报告");
  });

  it("should show all steps as completed when currentStep > 7", () => {
    render(<ProgressBar currentStep={8} />);
    const items = screen.getAllByRole("listitem");
    items.forEach((item) => {
      expect(item.getAttribute("data-state")).toBe("completed");
    });
  });

  // ---- progress bar ----
  it("should render overall progress bar with percentage", () => {
    render(<ProgressBar currentStep={0} />);
    expect(screen.getByText("准备中…")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should show step count and percentage during evaluation", () => {
    render(<ProgressBar currentStep={4} />);
    expect(screen.getByText("步骤 4 / 7")).toBeInTheDocument();
    expect(screen.getByText("57%")).toBeInTheDocument();
  });

  it("should show completion message when all steps done", () => {
    render(<ProgressBar currentStep={8} />);
    expect(screen.getByText("评估完成")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should render the progress bar fill element", () => {
    const { container } = render(<ProgressBar currentStep={3} />);
    const fill = container.querySelector(".progress-bar-fill");
    expect(fill).toBeInTheDocument();
    expect((fill as HTMLElement).style.width).toBe("43%");
  });

  // ---- transition effects ----
  it("should have step-icon-completed class on completed icon", () => {
    const { container } = render(<ProgressBar currentStep={3} />);
    const icon = container.querySelector(".step-icon-completed");
    expect(icon).toBeInTheDocument();
  });

  it("should have shimmer element on active step", () => {
    const { container } = render(<ProgressBar currentStep={4} />);
    const shimmer = container.querySelector(".step-shimmer");
    expect(shimmer).toBeInTheDocument();
  });

  it("should have step-row-completed class with staggered animation delay on completed rows", () => {
    const { container } = render(<ProgressBar currentStep={3} />);
    const rows = container.querySelectorAll(".step-row-completed");
    expect(rows.length).toBe(2); // steps 1 and 2
    // First completed row should have delay=0ms, second delay=80ms
    expect((rows[0] as HTMLElement).style.animationDelay).toBe("0ms");
    expect((rows[1] as HTMLElement).style.animationDelay).toBe("80ms");
  });

  it("should set progress bar to 0% width at step 0", () => {
    const { container } = render(<ProgressBar currentStep={0} />);
    const fill = container.querySelector(".progress-bar-fill");
    expect((fill as HTMLElement).style.width).toBe("0%");
  });

  // ---- steps 6-7 transition effects ----
  it("should show processing dots animation on step 6 active", () => {
    render(<ProgressBar currentStep={6} />);
    const span = document.querySelector(".step-name-processing");
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe("处理 AI 结果");
  });

  it("should show processing dots animation on step 4 active", () => {
    render(<ProgressBar currentStep={4} />);
    const span = document.querySelector(".step-name-processing");
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe("构建 AI 提示");
  });

  it("should show processing dots animation on step 5 active", () => {
    render(<ProgressBar currentStep={5} />);
    const span = document.querySelector(".step-name-processing");
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe("调用 AI 分析");
  });

  it("should not show processing dots on completed steps", () => {
    render(<ProgressBar currentStep={8} />);
    expect(document.querySelector(".step-name-processing")).toBeNull();
  });

  it("should show golden glow icon on step 7 when active", () => {
    const { container } = render(<ProgressBar currentStep={7} />);
    expect(container.querySelector(".step-icon-final")).toBeInTheDocument();
    expect(container.querySelector(".step-shimmer-final")).toBeInTheDocument();
  });

  it("should not show golden glow on step 6 when active", () => {
    const { container } = render(<ProgressBar currentStep={6} />);
    expect(container.querySelector(".step-icon-final")).toBeNull();
  });

  it("should render step 7 text in amber when active", () => {
    render(<ProgressBar currentStep={7} />);
    const el = screen.getByText("生成报告");
    expect(el.className).toContain("text-amber-500");
    expect(el.className).toContain("font-semibold");
  });

  it("should show completion pulse class on progress bar when all done", () => {
    const { container } = render(<ProgressBar currentStep={8} />);
    expect(container.querySelector(".progress-bar-complete")).toBeInTheDocument();
  });

  it("should not show completion pulse class during evaluation", () => {
    const { container } = render(<ProgressBar currentStep={7} />);
    expect(container.querySelector(".progress-bar-complete")).toBeNull();
  });

  it("should show '评估完成' in success color", () => {
    render(<ProgressBar currentStep={8} />);
    const el = screen.getByText("评估完成");
    expect(el.className).toContain("text-success");
  });

  it("should set green gradient background on fill when complete", () => {
    const { container } = render(<ProgressBar currentStep={8} />);
    const fill = container.querySelector(".progress-bar-fill") as HTMLElement;
    expect(fill.style.background).toContain("rgb(34, 197, 94)");
  });

  // ---- pre-steps (warm-up) ----
  it("should render pre-steps at the beginning of the list", () => {
    render(<ProgressBar currentStep={0} />);
    PRE_STEPS.forEach((s) => {
      expect(screen.getByText(s.stepName)).toBeInTheDocument();
    });
  });

  it("should mark pre-steps as completed when evaluation starts", () => {
    render(<ProgressBar currentStep={1} />);
    PRE_STEPS.forEach((s) => {
      const el = screen.getByText(s.stepName).closest("li");
      expect(el?.getAttribute("data-state")).toBe("completed");
    });
  });

  it("should render pre-step active icon with pulsing dot (not a number)", () => {
    const { container } = render(<ProgressBar currentStep={0} />);
    const dot = container.querySelector(".step-dot-pulse");
    expect(dot).toBeInTheDocument();
  });

  it("should render pre-step pending icon with dashed border and small dot", () => {
    const { container } = render(<ProgressBar currentStep={0} />);
    // First pre-step (-2) is pending, should have a small static dot
    const preStepPending = screen.getByText("初始化评估引擎").closest("li");
    expect(preStepPending?.getAttribute("data-state")).toBe("pending");
    expect(preStepPending?.querySelector(".step-dot-pulse")).toBeNull();
  });

  it("should have data-kind='pre' on pre-step list items", () => {
    render(<ProgressBar currentStep={0} />);
    const preItem = screen.getByText("初始化评估引擎").closest("li");
    expect(preItem?.getAttribute("data-kind")).toBe("pre");
  });

  // ---- post-steps (wrap-up) ----
  it("should show post-steps when currentStep reaches 7", () => {
    render(<ProgressBar currentStep={7} />);
    POST_STEPS.forEach((s) => {
      expect(screen.getByText(s.stepName)).toBeInTheDocument();
    });
  });

  it("should hide post-steps when currentStep < 7", () => {
    render(<ProgressBar currentStep={6} />);
    POST_STEPS.forEach((s) => {
      expect(screen.queryByText(s.stepName)).toBeNull();
    });
  });

  it("should mark all post-steps as completed when currentStep > 7", () => {
    render(<ProgressBar currentStep={8} />);
    POST_STEPS.forEach((s) => {
      const el = screen.getByText(s.stepName).closest("li");
      expect(el?.getAttribute("data-state")).toBe("completed");
    });
  });

  it("should have step-row-enter animation class on post-steps", () => {
    const { container } = render(<ProgressBar currentStep={7} />);
    const rows = container.querySelectorAll(".step-row-enter");
    expect(rows.length).toBe(2);
  });

  it("should have data-kind='post' on post-step list items", () => {
    render(<ProgressBar currentStep={7} />);
    const postItem = screen.getByText("整理评估数据").closest("li");
    expect(postItem?.getAttribute("data-kind")).toBe("post");
  });

  // ---- combined counts ----
  it("should show 11 steps when evaluation completes", () => {
    render(<ProgressBar currentStep={8} />);
    expect(screen.getAllByRole("listitem").length).toBe(11);
  });

  it("should show 9 steps during mid-evaluation (no post-steps yet)", () => {
    render(<ProgressBar currentStep={3} />);
    expect(screen.getAllByRole("listitem").length).toBe(9);
  });

  it("should not give pre-steps the step-row-completed animation", () => {
    const { container } = render(<ProgressBar currentStep={3} />);
    const preItem = screen.getByText("初始化评估引擎").closest("li");
    expect(preItem?.getAttribute("data-state")).toBe("completed");
    expect(preItem?.classList.contains("step-row-completed")).toBe(false);
  });

  it("should apply completion shine to progress bar when all done", () => {
    const { container } = render(<ProgressBar currentStep={8} />);
    expect(container.querySelector(".progress-bar-complete")).toBeInTheDocument();
  });
});
