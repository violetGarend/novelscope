import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RadarChart } from "./RadarChart";

describe("RadarChart — single model (backward compatible)", () => {
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
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
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
    const dataPoints = container.querySelectorAll("circle[stroke='#FFFFFF']");
    expect(dataPoints).toHaveLength(4);
  });

  it("should handle boundary scores (0 and 10)", () => {
    const { container } = render(
      <RadarChart hook={0} climax={10} cliffhanger={0} pacing={10} />
    );
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(2);
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

describe("RadarChart — dual model", () => {
  const secondModel = {
    name: "Doubao",
    scores: { hook: 6, climax: 7, cliffhanger: 5, pacing: 6 },
    color: "#7C3AED",
    strokeDasharray: "6,4",
  };

  it("should render two polygons when secondModel is provided", () => {
    const { container } = render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={secondModel}
      />
    );
    const polygons = container.querySelectorAll("polygon");
    expect(polygons.length).toBeGreaterThanOrEqual(2);
  });

  it("should render second polygon with dashed stroke", () => {
    const { container } = render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={secondModel}
      />
    );
    const polygons = container.querySelectorAll("polygon");
    const dashedPolygon = Array.from(polygons).find(
      (p) => p.getAttribute("stroke-dasharray") === "6,4"
    );
    expect(dashedPolygon).toBeInTheDocument();
  });

  it("should render legend with both model names", () => {
    render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={secondModel}
      />
    );
    expect(screen.getByText("DeepSeek")).toBeInTheDocument();
    expect(screen.getByText("Doubao")).toBeInTheDocument();
  });

  it("should use dual-model ARIA label", () => {
    render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={secondModel}
      />
    );
    expect(
      screen.getByLabelText("四维雷达图，DeepSeek 评分和 Doubao 评分叠加显示")
    ).toBeInTheDocument();
  });

  it("should render 8 data points (4 per model) in dual mode", () => {
    const { container } = render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={secondModel}
      />
    );
    const dataPoints = container.querySelectorAll("circle[stroke='#FFFFFF']");
    expect(dataPoints).toHaveLength(8);
  });

  it("should color primary model points with scoreColor and second model points with secondModel.color", () => {
    const { container } = render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={secondModel}
      />
    );
    const secondPoints = container.querySelectorAll(`circle[fill='${secondModel.color}']`);
    expect(secondPoints.length).toBeGreaterThanOrEqual(1);
  });
});

describe("RadarChart — divergence markers", () => {
  const secondModel = {
    name: "Doubao",
    scores: { hook: 4, climax: 5, cliffhanger: 5, pacing: 6 },
    color: "#7C3AED",
    strokeDasharray: "6,4",
  };

  it("should show ⚠ icons for dimensions with divergence", () => {
    render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={secondModel}
        divergenceDims={["hook", "climax"]}
      />
    );
    const warnings = screen.getAllByText("⚠");
    expect(warnings.length).toBeGreaterThanOrEqual(2);
  });

  it("should not show ⚠ icons when divergenceDims is empty", () => {
    render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={secondModel}
        divergenceDims={[]}
      />
    );
    expect(screen.queryByText("⚠")).toBeNull();
  });

  it("should not show ⚠ icons when divergenceDims is not provided", () => {
    render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={secondModel}
      />
    );
    expect(screen.queryByText("⚠")).toBeNull();
  });
});

describe("RadarChart — color-blind dual encoding", () => {
  it("should use different stroke-dasharray for second model (line style encoding)", () => {
    const { container } = render(
      <RadarChart
        hook={8} climax={7} cliffhanger={6} pacing={5}
        modelName="DeepSeek"
        secondModel={{
          name: "Doubao",
          scores: { hook: 6, climax: 7, cliffhanger: 5, pacing: 6 },
          color: "#7C3AED",
          strokeDasharray: "6,4",
        }}
      />
    );
    const polygons = container.querySelectorAll("polygon");
    const hasDashed = Array.from(polygons).some(
      (p) => p.getAttribute("stroke-dasharray") === "6,4"
    );
    const hasSolid = Array.from(polygons).some(
      (p) => !p.getAttribute("stroke-dasharray")
    );
    expect(hasDashed).toBe(true);
    expect(hasSolid).toBe(true);
  });
});
