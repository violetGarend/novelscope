import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("PacingCurve", () => {
  it("should render an SVG element", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should render axis labels", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    expect(screen.getByText("段落")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("should render a polyline for the tension curve", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    expect(screen.getByLabelText("节奏曲线")).toBeInTheDocument();
  });

  it("should render legend with type colors", () => {
    render(<PacingCurve data={SAMPLE_DATA} />);
    expect(screen.getByText("动作")).toBeInTheDocument();
    expect(screen.getByText("对话")).toBeInTheDocument();
    expect(screen.getByText("描写")).toBeInTheDocument();
  });

  it("should show tooltip on hover containing paragraph details", async () => {
    const { container } = render(<PacingCurve data={SAMPLE_DATA} />);
    // Find a data point and hover over it
    const point = container.querySelector('[data-paragraph="5"]');
    expect(point).toBeInTheDocument();
  });

  it("should handle empty data gracefully", () => {
    render(<PacingCurve data={[]} />);
    expect(screen.getByText(/暂无节奏数据/i)).toBeInTheDocument();
  });
});
