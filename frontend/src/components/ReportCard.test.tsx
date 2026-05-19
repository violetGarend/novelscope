import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportCard, EmptyReport, ErrorReport, type EvaluationReport } from "./ReportCard";

const FULL_REPORT: EvaluationReport = {
  reportId: "report_test_001",
  scores: {
    overallScore: 7.2,
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
    suggestions: ["中间段落的对话节奏可以更紧凑，适当减少重复信息"],
  },
  isPartial: false,
  tokenUsage: { promptTokens: 1200, completionTokens: 350 },
  costEstimate: 0.0019,
};

describe("ReportCard — full report", () => {
  it("should display the overall score prominently", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByText("7.2")).toBeInTheDocument();
  });

  it("should display all four sub-scores with labels", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByText("Hook")).toBeInTheDocument();
    expect(screen.getByText("爽点密度")).toBeInTheDocument();
    expect(screen.getByText("章末悬念")).toBeInTheDocument();
    expect(screen.getByText("节奏")).toBeInTheDocument();
  });

  it("should show highlights before suggestions (优势先行)", () => {
    render(<ReportCard report={FULL_REPORT} />);
    const highlightHeading = screen.getByText("亮点分析");
    const suggestionHeading = screen.getByText("改进建议");
    // highlights should appear before suggestions in the DOM
    expect(
      highlightHeading.compareDocumentPosition(suggestionHeading)
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
    // 节奏分数是 5，不算低分（>=5），不应有低分警告
    expect(screen.queryByText(/低于.*分/)).toBeNull();
  });

  it("should render pacing curve SVG with tension data", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByLabelText("节奏曲线")).toBeInTheDocument();
    expect(screen.getByText("节奏曲线")).toBeInTheDocument();
  });

  it("should show pacing stats (CV + type ratio)", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByText(/变异系数 CV:/)).toBeInTheDocument();
    expect(screen.getByText("0.45")).toBeInTheDocument();
    expect(screen.getByText(/10%/)).toBeInTheDocument();
    expect(screen.getByText(/60%/)).toBeInTheDocument();
    expect(screen.getByText(/30%/)).toBeInTheDocument();
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
    // 建设性语气：用"建议"而非"问题"，用"可以提升"而非"不好"
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByText("改进建议")).toBeInTheDocument();
    // 不应出现考试式语气
    expect(screen.queryByText("问题")).toBeNull();
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

describe("ReportCard — partial result", () => {
  const PARTIAL_REPORT: EvaluationReport = {
    ...FULL_REPORT,
    llmResult: null,
    isPartial: true,
    scores: {
      overallScore: 5.0,
      hookScore: 0,
      climaxScore: 7,
      cliffhangerScore: 0,
      pacingScore: 5,
    },
  };

  it("should show a yellow partial-result banner", () => {
    render(<ReportCard report={PARTIAL_REPORT} />);
    const banner = screen.getByText(/部分评估结果/i);
    expect(banner).toBeInTheDocument();
  });

  it("should still display available scores", () => {
    render(<ReportCard report={PARTIAL_REPORT} />);
    expect(screen.getByText("5.0")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // pacing sub-score
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
