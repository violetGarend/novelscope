import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBadge } from "./ScoreBadge";

describe("ScoreBadge", () => {
  it("should render the score number", () => {
    render(<ScoreBadge score={7} />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("should render score with one decimal place for non-integer scores", () => {
    render(<ScoreBadge score={7.5} />);
    expect(screen.getByText("7.5")).toBeInTheDocument();
  });

  it("should show green color for high scores (7-10)", () => {
    const { rerender } = render(<ScoreBadge score={7} />);
    expect(screen.getByText("7").className).toContain("text-score-high");

    rerender(<ScoreBadge score={10} />);
    expect(screen.getByText("10").className).toContain("text-score-high");
  });

  it("should show yellow color for medium scores (5-6)", () => {
    const { rerender } = render(<ScoreBadge score={5} />);
    expect(screen.getByText("5").className).toContain("text-score-mid");

    rerender(<ScoreBadge score={6} />);
    expect(screen.getByText("6").className).toContain("text-score-mid");
  });

  it("should show red color for low scores (0-4)", () => {
    const { rerender } = render(<ScoreBadge score={0} />);
    expect(screen.getByText("0").className).toContain("text-score-low");

    rerender(<ScoreBadge score={4} />);
    expect(screen.getByText("4").className).toContain("text-score-low");
  });

  it("should render an optional label", () => {
    render(<ScoreBadge score={8} label="爽点密度" />);
    expect(screen.getByText("爽点密度")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("should render the score in Geist Mono font", () => {
    render(<ScoreBadge score={9} />);
    const scoreEl = screen.getByText("9");
    expect(scoreEl.className).toContain("font-mono");
  });

  it("should not show '参考分' badge when source is llm", () => {
    render(<ScoreBadge score={8} label="Hook" source="llm" />);
    expect(screen.queryByText("参考分")).not.toBeInTheDocument();
  });

  it("should not show '参考分' badge when source is undefined", () => {
    render(<ScoreBadge score={8} label="Hook" />);
    expect(screen.queryByText("参考分")).not.toBeInTheDocument();
  });

  it("should show '参考分' badge when source is rule", () => {
    render(<ScoreBadge score={6} label="Hook" source="rule" />);
    const badge = screen.getByText("参考分");
    expect(badge).toBeInTheDocument();
    expect(badge.title).toBe("AI 深度分析未完成，当前为规则引擎参考分");
  });
});
