import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PacingCurve, type PacingCurvePoint } from "./PacingCurve";

const SAMPLE_DATA: PacingCurvePoint[] = [
  { paragraph: 1, tension: 3, type: "description" },
  { paragraph: 2, tension: 5, type: "dialogue" },
  { paragraph: 3, tension: 7, type: "action" },
  { paragraph: 4, tension: 4, type: "description" },
  { paragraph: 5, tension: 8, type: "action" },
  { paragraph: 6, tension: 6, type: "dialogue" },
  { paragraph: 7, tension: 9, type: "action" },
  { paragraph: 8, tension: 5, type: "dialogue" },
  { paragraph: 9, tension: 3, type: "description" },
  { paragraph: 10, tension: 7, type: "action" },
];

function makeSample(count: number): PacingCurvePoint[] {
  return Array.from({ length: count }, (_, i) => ({
    paragraph: i + 1,
    tension: Math.round((3 + 6 * Math.abs(Math.sin(i * 0.3))) * 10) / 10,
    type: (["action", "dialogue", "description"] as const)[i % 3],
  }));
}

let originalGetBoundingClientRect: typeof Element.prototype.getBoundingClientRect;

function mockRect(w = 730, h = 250, l = 0, t = 0) {
  return { width: w, height: h, left: l, top: t, right: l + w, bottom: t + h, x: l, y: t, toJSON: () => ({}) } as DOMRect;
}

beforeEach(() => {
  originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    // Use tagName instead of instanceof (more reliable in jsdom)
    const tag = (this as Element).tagName?.toLowerCase();
    if (tag === "svg" || tag === "path") return mockRect(730, 250, 0, 0);
    if (tag === "div") return mockRect(730, 300, 0, 0);
    return originalGetBoundingClientRect?.call(this) ?? mockRect(0, 0, 0, 0);
  };
});

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalGetBoundingClientRect!;
});

describe("PacingCurve", () => {
  // ---- basic rendering ----
  it("should render an SVG element", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    expect(screen.getByRole("img", { name: "节奏曲线" })).toBeInTheDocument();
  });

  it("should render axis labels (Y-axis 0 and 10, X-axis label)", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    expect(screen.getByText("段落")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    // "10" appears both as Y-tick and X-tick for paragraph 10
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(2);
  });

  it("should render legend with type colors", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    expect(screen.getByText("动作")).toBeInTheDocument();
    expect(screen.getByText("对话")).toBeInTheDocument();
    expect(screen.getByText("描写")).toBeInTheDocument();
  });

  it("should handle empty data gracefully", () => {
    render(<PacingCurve data={[]} />);
    expect(screen.getByText(/暂无节奏数据/i)).toBeInTheDocument();
  });

  // ---- data points ----
  it("should render a circle for each data point", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const circles = container.querySelectorAll("circle[data-paragraph]");
    expect(circles).toHaveLength(SAMPLE_DATA.length);
  });

  it("should use smaller circles for dense data (25+ points)", () => {
    const dense = makeSample(30);
    const { container } = render(<PacingCurve data={dense} />);
    const circle = container.querySelector("circle[data-paragraph]");
    expect(circle).toBeInTheDocument();
    expect(circle!.getAttribute("r")).toBe("3");
  });

  it("should use normal circles for sparse data (10 points)", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const circle = container.querySelector("circle[data-paragraph]");
    expect(circle!.getAttribute("r")).toBe("5");
  });

  // ---- X-axis ticks ----
  it("should show X-axis ticks for all paragraphs when sparse (≤15 points)", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    // 10 points → tickInterval=1: all paragraphs get tick labels
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(2); // Y-tick + X-tick
  });

  it("should show sparse X-axis ticks for dense data (30+ points)", () => {
    const dense = makeSample(35);
    render(<PacingCurve data={dense} />);
    // tickInterval=10 for 30+ points: only 10, 20, 30 + first/last
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  // ---- tooltip: onMouseMove ----
  it("should show tooltip when mouse hovers near a data point", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const svg = container.querySelector("svg")!;

    // SVG rendered 730px wide, viewBox 800px → pixelX * (800/730) = svgX
    // Paragraph 5: toX(5,1,10) = 50 + 4/9 * 730 ≈ 374.4 svg coords
    // Pixel: 374.4 * (730/800) ≈ 341.7
    const svgX_5 = 50 + (4 / 9) * (800 - 50 - 20);
    const svgY_5 = 20 + (1 - 8 / 10) * (300 - 20 - 50);
    const px = (svgX_5 / 800) * 730;
    const py = (svgY_5 / 300) * 250;

    fireEvent.mouseMove(svg, { clientX: px, clientY: py });

    expect(screen.getByText(/第5段/)).toBeInTheDocument();
    expect(screen.getByText(/张力: 8\/10/)).toBeInTheDocument();
  });

  it("should hide tooltip when mouse leaves SVG", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const svg = container.querySelector("svg")!;

    fireEvent.mouseMove(svg, { clientX: 170, clientY: 80 });
    expect(screen.queryByText(/第\d+段/)).toBeInTheDocument();

    fireEvent.mouseLeave(svg);
    expect(screen.queryByText(/第\d+段/)).toBeNull();
  });

  it("should switch to nearest point as mouse moves across curve", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const svg = container.querySelector("svg")!;

    // Hover near paragraph 3 (action, tension 7)
    const vx3 = 50 + (2 / 9) * (800 - 50 - 20);
    const vy3 = 20 + (1 - 7 / 10) * (300 - 20 - 50);
    fireEvent.mouseMove(svg, { clientX: (vx3 / 800) * 730, clientY: (vy3 / 300) * 250 });
    expect(screen.getByText(/第3段/)).toBeInTheDocument();
    expect(screen.getByText(/第3段.*动作/)).toBeInTheDocument();

    // Move near paragraph 8 (dialogue, tension 5)
    const vx8 = 50 + (7 / 9) * (800 - 50 - 20);
    const vy8 = 20 + (1 - 5 / 10) * (300 - 20 - 50);
    fireEvent.mouseMove(svg, { clientX: (vx8 / 800) * 730, clientY: (vy8 / 300) * 250 });
    expect(screen.getByText(/第8段/)).toBeInTheDocument();
    expect(screen.getByText(/第8段.*对话/)).toBeInTheDocument();
  });

  it("should always show nearest point (even when mouse is far away)", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const svg = container.querySelector("svg")!;

    // Mouse at (0,0) → nearest point should be paragraph 1
    fireEvent.mouseMove(svg, { clientX: 0, clientY: 0 });
    expect(screen.getByText(/第1段/)).toBeInTheDocument();
  });

  // ---- CSS hover ----
  it("should have pacing-dot class on data points", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const dot = container.querySelector(".pacing-dot");
    expect(dot).toBeInTheDocument();
  });

  // ---- dynamic animation ----
  it("should set stroke-dasharray after mount (fallback 2000 in jsdom)", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    const line = document.querySelector(".pacing-line") as SVGPathElement;
    expect(line).toBeInTheDocument();
    // jsdom lacks getTotalLength → falls back to 2000
    expect(line.style.strokeDasharray).toBe("2000");
    expect(line.style.strokeDashoffset).toBe("2000");
  });

  // ---- regression: old per-circle handlers removed ----
  it("should not have onMouseEnter/onMouseLeave on individual circles", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const circle = container.querySelector("circle[data-paragraph]");
    expect(circle).toBeInTheDocument();
    expect(circle!.getAttribute("onmouseenter")).toBeNull();
    expect(circle!.getAttribute("onmouseleave")).toBeNull();
  });

  // ---- three segmented lines (Issue #17) ----
  it("should render three segmented paths (one per type)", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const paths = container.querySelectorAll("path[data-type]");
    const types = Array.from(paths).map((p) => p.getAttribute("data-type"));
    expect(types).toContain("action");
    expect(types).toContain("dialogue");
    expect(types).toContain("description");
  });

  it("should render a dashed trend line", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const trend = container.querySelector(".trend-line") as SVGPathElement;
    expect(trend).toBeInTheDocument();
    expect(trend.getAttribute("stroke-dasharray")).toBe("6,4");
  });

  it("should render chart title", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    expect(screen.getByText("段落张力走势")).toBeInTheDocument();
  });

  it("should render line-segment legend (not dots)", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    // Legend items are buttons with line segments, not colored dots
    expect(screen.getByText("动作")).toBeInTheDocument();
    expect(screen.getByText("对话")).toBeInTheDocument();
    expect(screen.getByText("描写")).toBeInTheDocument();
    // Legacy rounded dots should not be present in legend area
    const legend = screen.getByText("动作").closest("div")!;
    const dots = legend.querySelectorAll(".rounded-full");
    expect(dots).toHaveLength(0);
  });

  it("should hide action line when legend is clicked", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    // All action paths visible initially
    const actionPathsBefore = container.querySelectorAll(
      "path[data-type='action']"
    );
    expect(actionPathsBefore.length).toBeGreaterThan(0);

    // Click "动作" legend button
    fireEvent.click(screen.getByText("动作"));

    // Action paths should be gone
    const actionPathsAfter = container.querySelectorAll(
      "path[data-type='action']"
    );
    expect(actionPathsAfter).toHaveLength(0);
  });

  it("should restore action line when legend is clicked again", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const btn = screen.getByText("动作");
    fireEvent.click(btn); // hide
    fireEvent.click(btn); // show
    const actionPaths = container.querySelectorAll("path[data-type='action']");
    expect(actionPaths.length).toBeGreaterThan(0);
  });

  it("should dim legend item when hidden", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    const btn = screen.getByText("动作").closest("button")!;
    expect(btn.className).toContain("opacity-100");
    fireEvent.click(btn);
    expect(btn.className).toContain("opacity-30");
  });

  it("should hide data circles when type is hidden", () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    const actionCirclesBefore = container.querySelectorAll(
      "circle[data-type='action']"
    );
    expect(actionCirclesBefore.length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("动作"));
    const actionCirclesAfter = container.querySelectorAll(
      "circle[data-type='action']"
    );
    expect(actionCirclesAfter).toHaveLength(0);
  });

  // ---- edge cases ----
  it("should render single data point without error", () => {
    const single: PacingCurvePoint[] = [{ paragraph: 1, tension: 5, type: "dialogue" }];
    render(<PacingCurve data={single} />);
    expect(screen.getByRole("img", { name: "节奏曲线" })).toBeInTheDocument();
    expect(document.querySelectorAll("circle[data-paragraph]")).toHaveLength(1);
  });

  it("should render two data points as a line segment", () => {
    const two: PacingCurvePoint[] = [
      { paragraph: 1, tension: 2, type: "action" },
      { paragraph: 2, tension: 8, type: "description" },
    ];
    render(<PacingCurve data={two} />);
    expect(document.querySelectorAll("circle[data-paragraph]")).toHaveLength(2);
  });
});
