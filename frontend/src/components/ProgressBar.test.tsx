import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar, EVALUATION_STEPS, PRE_STEPS, POST_STEPS } from "./ProgressBar";

describe("ProgressBar", () => {
  it("should render all 7 evaluation steps", () => {
    render(<ProgressBar currentStep={0} />);
    EVALUATION_STEPS.forEach((step) => {
      const matches = screen.getAllByText(step.stepName);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should mark steps before currentStep as completed", () => {
    render(<ProgressBar currentStep={3} />);
    const step1 = screen.getByText("正在验证文本").closest("li");
    const step2 = screen.getByText("分析爽点密度").closest("li");
    const step3 = screen.getByText("分析节奏").closest("li");
    const step4 = screen.getByText("构建 AI 提示").closest("li");

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

  it("should highlight the current step role", () => {
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
    const fill = container.querySelector(".progress-fill-bar");
    expect(fill).toBeInTheDocument();
    expect((fill as HTMLElement).style.width).toBe("43%");
  });

  it("should set progress bar to 0% width at step 0", () => {
    const { container } = render(<ProgressBar currentStep={0} />);
    const fill = container.querySelector(".progress-fill-bar");
    expect((fill as HTMLElement).style.width).toBe("0%");
  });

  it("should show step 0/7 at initial state", () => {
    render(<ProgressBar currentStep={0} />);
    expect(screen.getByText("步骤 0 / 7")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  // ---- pre-steps ----
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

  // ---- post-steps ----
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

  // ---- counts ----
  it("should show 11 steps when evaluation completes", () => {
    render(<ProgressBar currentStep={8} />);
    expect(screen.getAllByRole("listitem").length).toBe(11);
  });

  it("should show 9 steps during mid-evaluation", () => {
    render(<ProgressBar currentStep={3} />);
    expect(screen.getAllByRole("listitem").length).toBe(9);
  });

  // ---- wave animation ----
  it("should show wave animation on active step", () => {
    const { container } = render(<ProgressBar currentStep={3} />);
    expect(container.querySelector(".wave-status")).toBeInTheDocument();
  });

  it("should not show wave animation when all steps completed", () => {
    const { container } = render(<ProgressBar currentStep={8} />);
    expect(container.querySelector(".wave-status")).toBeNull();
  });

  it("should render description text for each step", () => {
    render(<ProgressBar currentStep={3} />);
    expect(screen.getByText("解析段落张力曲线")).toBeInTheDocument();
    expect(screen.getByText("检查文本格式")).toBeInTheDocument();
  });
});
