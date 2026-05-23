import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RadarChart } from "./RadarChart";

describe("RadarChart", () => {
  it("should render SVG with aria-label", () => {
    render(
      <RadarChart hook={7} climax={8} cliffhanger={6} pacing={5} />
    );
    expect(screen.getByLabelText("四维雷达图")).toBeInTheDocument();
  });

  it("should render all four axis labels with default names", () => {
    render(
      <RadarChart hook={7} climax={8} cliffhanger={6} pacing={5} />
    );
    expect(screen.getByText("Hook")).toBeInTheDocument();
    expect(screen.getByText("爽点密度")).toBeInTheDocument();
    expect(screen.getByText("章末悬念")).toBeInTheDocument();
    expect(screen.getByText("节奏")).toBeInTheDocument();
  });

  it("should render all four scores next to axis labels", () => {
    render(
      <RadarChart hook={7} climax={8.5} cliffhanger={6} pacing={5} />
    );
    // Unique score values (not also grid labels)
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    // "5" appears as both grid label and pacing score
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(2);
  });

  it("should render custom labels when provided", () => {
    render(
      <RadarChart
        hook={7}
        climax={8}
        cliffhanger={6}
        pacing={5}
        labels={{ hook: "开篇", climax: "高潮", cliffhanger: "收尾", pacing: "节拍" }}
      />
    );
    expect(screen.getByText("开篇")).toBeInTheDocument();
    expect(screen.getByText("高潮")).toBeInTheDocument();
    expect(screen.getByText("收尾")).toBeInTheDocument();
    expect(screen.getByText("节拍")).toBeInTheDocument();
    expect(screen.queryByText("Hook")).not.toBeInTheDocument();
  });

  it("should render grid level labels", () => {
    render(
      <RadarChart hook={7} climax={8} cliffhanger={6} pacing={5} />
    );
    expect(screen.getByText("2.5")).toBeInTheDocument();
    expect(screen.getByText("7.5")).toBeInTheDocument();
    // "5" and "10" may also appear as scores, use getAllByText
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(1);
  });

  it("should render a polygon for data area", () => {
    const { container } = render(
      <RadarChart hook={7} climax={8} cliffhanger={6} pacing={5} />
    );
    const polygon = container.querySelector("polygon");
    expect(polygon).toBeInTheDocument();
    expect(polygon!.getAttribute("points")).toBeTruthy();
  });

  it("should render four data point circles", () => {
    const { container } = render(
      <RadarChart hook={7} climax={8} cliffhanger={6} pacing={5} />
    );
    // There are grid circles + data point circles, data points have r=4 with white stroke
    const dataPoints = container.querySelectorAll("circle[stroke='#FFFFFF']");
    expect(dataPoints).toHaveLength(4);
  });

  it("should handle boundary scores (0 and 10)", () => {
    const { container } = render(
      <RadarChart hook={0} climax={10} cliffhanger={0} pacing={10} />
    );
    // "0" and "10" appear as both scores and grid labels
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(2);
    // Should still render polygon
    const polygon = container.querySelector("polygon");
    expect(polygon).toBeInTheDocument();
  });

  it("should handle decimal scores", () => {
    render(
      <RadarChart hook={7.3} climax={6.8} cliffhanger={4.5} pacing={9.1} />
    );
    expect(screen.getByText("7.3")).toBeInTheDocument();
    expect(screen.getByText("6.8")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("9.1")).toBeInTheDocument();
  });
});
