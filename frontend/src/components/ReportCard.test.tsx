import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportCard, EmptyReport, ErrorReport, type EvaluationReport } from "./ReportCard";

const FULL_REPORT: EvaluationReport = {
  reportId: "report_test_001",
  scores: {
    hookScore: 8,
    climaxScore: 7,
    cliffhangerScore: 6,
    pacingScore: 5,
  },
  climaxResult: {
    score: 7,
    matchedKeywords: ["打脸", "碾压"],
    keywordCategories: { reversal: ["打脸", "碾压"], shock: [], breakthrough: [], conflict: [], emotion: [] },
    dialogueDensity: 0.5,
    conflictDensity: 0.3,
  },
  pacingResult: {
    score: 5,
    curve: [
      { paragraph: 1, tension: 3, type: "description" },
      { paragraph: 2, tension: 5, type: "dialogue" },
      { paragraph: 3, tension: 8, type: "action" },
      { paragraph: 4, tension: 6, type: "dialogue" },
      { paragraph: 5, tension: 9, type: "action" },
    ],
    cv: 0.45,
    typeRatio: { action: 0.1, dialogue: 0.6, description: 0.3 },
  },
  fillerResult: {
    items: [],
    suspiciousPairs: [],
  },
  llmResult: {
    hookScore: 8,
    climaxScore: 7,
    cliffhangerScore: 6,
    pacingScore: 5,
    consistencyIssues: ["第3段提到角色A在室内，第5段又说他在户外，前后矛盾"],
    highlights: ["开头冲突感强，能迅速抓住读者注意力", "结尾悬念设置有力"],
    suggestions: [
      { severity: "warning", location: "中段对话", issue: "中间段落的对话节奏可以更紧凑", direction: "适当减少重复信息" },
    ],
  },
  isPartial: false,
  tokenUsage: { promptTokens: 1200, completionTokens: 350 },
  costEstimate: 0.0019,
};

describe("ReportCard — full report", () => {
  it("should render radar chart with four axis labels", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByLabelText("四维雷达图")).toBeInTheDocument();
    expect(screen.getByText("Hook")).toBeInTheDocument();
    expect(screen.getByText("爽点密度")).toBeInTheDocument();
    expect(screen.getByText("章末悬念")).toBeInTheDocument();
    expect(screen.getByText("节奏")).toBeInTheDocument();
  });

  it("should not render overallScore number", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.queryByText("综合评分")).not.toBeInTheDocument();
    expect(screen.queryByText("/10")).not.toBeInTheDocument();
  });

  it("should show highlights before suggestions (优势先行)", () => {
    render(<ReportCard report={FULL_REPORT} />);
    const highlightHeading = screen.getByText("亮点分析");
    const suggestionHeading = screen.getByText("改进建议");
    expect(
      highlightHeading.compareDocumentPosition(suggestionHeading)
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("should show suggestions before radar chart (建议优先于可视化)", () => {
    render(<ReportCard report={FULL_REPORT} />);
    const suggestionHeading = screen.getByText("改进建议");
    const radarHeading = screen.getByText("四维评分");
    expect(
      suggestionHeading.compareDocumentPosition(radarHeading)
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("should display consistency issues", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(
      screen.getByText(/角色A在室内.*前后矛盾/)
    ).toBeInTheDocument();
  });

  it("should display the report ID", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByText(/report_test_001/)).toBeInTheDocument();
  });

  it("should not show 'low score' warnings for scores >= 5", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.queryByText(/低于.*分/)).toBeNull();
  });

  it("should render pacing curve SVG with tension data", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByLabelText("节奏曲线")).toBeInTheDocument();
  });

  it("should show pacing stats (CV + type ratio)", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByText("变异系数 CV")).toBeInTheDocument();
    expect(screen.getByText("0.45")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("should not render pacing section when curve is empty", () => {
    const noCurveReport = {
      ...FULL_REPORT,
      pacingResult: { ...FULL_REPORT.pacingResult, curve: [] },
    };
    render(<ReportCard report={noCurveReport} />);
    expect(screen.queryByLabelText("节奏曲线")).toBeNull();
  });

  it("should show report tone as editorial feedback, not exam result", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByText("改进建议")).toBeInTheDocument();
    expect(screen.queryByText("不合格")).toBeNull();
  });

  it("should display token usage and cost at the bottom", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByText(/Token 用量：/)).toBeInTheDocument();
    expect(screen.getByText(/输入 1,200/)).toBeInTheDocument();
    expect(screen.getByText(/输出 350/)).toBeInTheDocument();
    expect(screen.getByText(/预估成本：¥0\.0019/)).toBeInTheDocument();
  });

  it("should not show token section when tokenUsage is null", () => {
    const noTokenReport = { ...FULL_REPORT, tokenUsage: null, costEstimate: null };
    render(<ReportCard report={noTokenReport} />);
    expect(screen.queryByText(/Token 用量/)).toBeNull();
    expect(screen.queryByText(/预估成本/)).toBeNull();
  });

  it("should not show token section when tokenUsage is undefined", () => {
    const noTokenReport = { ...FULL_REPORT, tokenUsage: undefined, costEstimate: undefined };
    render(<ReportCard report={noTokenReport} />);
    expect(screen.queryByText(/Token 用量/)).toBeNull();
  });
});

describe("ReportCard — suggestions severity", () => {
  it("should display severity badges (critical/warning/info)", () => {
    const reportWithAllSeverities: EvaluationReport = {
      ...FULL_REPORT,
      llmResult: {
        ...FULL_REPORT.llmResult!,
        suggestions: [
          { severity: "critical", location: "开头", issue: "开篇太平淡", direction: "增加冲突场景" },
          { severity: "warning", location: "中段", issue: "节奏拖沓", direction: "精简描述" },
          { severity: "info", location: "结尾", issue: "可加钩子", direction: "增加悬念暗示" },
        ],
      },
    };
    render(<ReportCard report={reportWithAllSeverities} />);
    // Badge text contains icon prefix, use exact:false
    expect(screen.getByText("关键", { exact: false })).toBeInTheDocument();
    // "建议" matches both heading "改进建议" and warning badge — should appear at least twice
    const suggestionMatches = screen.getAllByText("建议", { exact: false });
    expect(suggestionMatches.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("观察", { exact: false })).toBeInTheDocument();
  });

  it("should sort suggestions by severity: critical > warning > info", () => {
    const unsortedReport: EvaluationReport = {
      ...FULL_REPORT,
      llmResult: {
        ...FULL_REPORT.llmResult!,
        suggestions: [
          { severity: "info", location: "", issue: "info-item", direction: "" },
          { severity: "critical", location: "", issue: "critical-item", direction: "" },
          { severity: "warning", location: "", issue: "warning-item", direction: "" },
        ],
      },
    };
    render(<ReportCard report={unsortedReport} />);
    const items = screen.getAllByText(/-item$/);
    expect(items[0]).toHaveTextContent("critical-item");
    expect(items[1]).toHaveTextContent("warning-item");
    expect(items[2]).toHaveTextContent("info-item");
  });

  it("should show location tag when present", () => {
    const reportWithLocation: EvaluationReport = {
      ...FULL_REPORT,
      llmResult: {
        ...FULL_REPORT.llmResult!,
        suggestions: [
          { severity: "warning", location: "第3-5段", issue: "对话重复", direction: "精简" },
        ],
      },
    };
    render(<ReportCard report={reportWithLocation} />);
    expect(screen.getByText("[第3-5段]")).toBeInTheDocument();
  });

  it("should show direction hint when present", () => {
    const reportWithDirection: EvaluationReport = {
      ...FULL_REPORT,
      llmResult: {
        ...FULL_REPORT.llmResult!,
        suggestions: [
          { severity: "warning", location: "", issue: "节奏问题", direction: "减少大段描写，增加对话" },
        ],
      },
    };
    render(<ReportCard report={reportWithDirection} />);
    expect(screen.getByText(/→ 减少大段描写，增加对话/)).toBeInTheDocument();
  });
});

describe("ReportCard — empty states", () => {
  it("should show empty highlight state when no highlights", () => {
    const noHighlights: EvaluationReport = {
      ...FULL_REPORT,
      llmResult: { ...FULL_REPORT.llmResult!, highlights: [] },
    };
    render(<ReportCard report={noHighlights} />);
    expect(screen.getByText("规则引擎未检测到显著亮点")).toBeInTheDocument();
  });

  it("should show empty suggestion state when no suggestions", () => {
    const noSuggestions: EvaluationReport = {
      ...FULL_REPORT,
      llmResult: { ...FULL_REPORT.llmResult!, suggestions: [] },
    };
    render(<ReportCard report={noSuggestions} />);
    expect(screen.getByText("未发现明显问题")).toBeInTheDocument();
  });
});

describe("ReportCard — filler section", () => {
  it("should show filler detection section when filler items exist", () => {
    const reportWithFiller: EvaluationReport = {
      ...FULL_REPORT,
      fillerResult: {
        items: [{ paragraph: 3, reason: "第3段内容重复，与前文第1段相似", suggestion: "建议精简或合并" }],
        suspiciousPairs: [],
      },
    };
    render(<ReportCard report={reportWithFiller} />);
    expect(screen.getByText("注水检测")).toBeInTheDocument();
    expect(screen.getByText(/第3段内容重复/)).toBeInTheDocument();
  });

  it("should show suspicious pairs when present", () => {
    const reportWithPairs: EvaluationReport = {
      ...FULL_REPORT,
      fillerResult: {
        items: [],
        suspiciousPairs: [{ paragraphA: 1, paragraphB: 5, similarity: 0.82 }],
      },
    };
    render(<ReportCard report={reportWithPairs} />);
    expect(screen.getByText("注水检测")).toBeInTheDocument();
    expect(screen.getByText(/第1段 ↔ 第5段/)).toBeInTheDocument();
  });

  it("should not show filler section when no filler items or pairs", () => {
    const noFiller: EvaluationReport = {
      ...FULL_REPORT,
      fillerResult: { items: [], suspiciousPairs: [] },
    };
    render(<ReportCard report={noFiller} />);
    expect(screen.queryByText("注水检测")).toBeNull();
  });
});

describe("ReportCard — partial result", () => {
  const PARTIAL_REPORT: EvaluationReport = {
    ...FULL_REPORT,
    llmResult: null,
    isPartial: true,
    hookSource: "rule",
    cliffhangerSource: "rule",
    scores: {
      hookScore: 6,
      climaxScore: 7,
      cliffhangerScore: 5,
      pacingScore: 5,
    },
  };

  it("should show a yellow partial-result banner", () => {
    render(<ReportCard report={PARTIAL_REPORT} />);
    const banner = screen.getByText(/部分评估结果/i);
    expect(banner).toBeInTheDocument();
  });

  it("should show rule fallback warning when hookSource or cliffhangerSource is rule", () => {
    render(<ReportCard report={PARTIAL_REPORT} />);
    expect(screen.getByText(/规则引擎参考分/)).toBeInTheDocument();
  });

  it("should not show LLM-dependent sections when llmResult is null", () => {
    render(<ReportCard report={PARTIAL_REPORT} />);
    expect(screen.queryByText("亮点分析")).toBeNull();
    expect(screen.queryByText("改进建议")).toBeNull();
    expect(screen.queryByText("一致性检查")).toBeNull();
  });
});

describe("EmptyReport", () => {
  it("should show a guide card with action prompt", () => {
    render(<EmptyReport />);
    expect(screen.getByText(/获取 AI 写作质量分析报告/i)).toBeInTheDocument();
    expect(screen.getByText(/输入章节文本并点击/i)).toBeInTheDocument();
  });

  it("should not show any scores", () => {
    render(<EmptyReport />);
    expect(screen.queryByText(/\/10/)).toBeNull();
  });
});

describe("ErrorReport", () => {
  it("should show red error card with message and retry button", () => {
    const onRetry = vi.fn();
    render(<ErrorReport message="网络连接失败" onRetry={onRetry} />);

    expect(screen.getByText(/网络连接失败/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /重试/i });
    expect(retryBtn).toBeInTheDocument();
  });

  it("should call onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorReport message="评估超时" onRetry={onRetry} />);

    screen.getByRole("button", { name: /重试/i }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
