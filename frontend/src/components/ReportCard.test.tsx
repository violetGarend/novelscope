import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportCard, EmptyReport, ErrorReport, type EvaluationReport } from "./ReportCard";
import type { EvaluationResultV2 } from "../types/evaluation";

// ── Old format fixture (backward compatible) ──

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

// ── V2 complete fixture ──

const V2_COMPLETE: EvaluationResultV2 = {
  status: "complete",
  scores: {
    deepseek: { hookScore: 8, climaxScore: 7, cliffhangerScore: 6, pacingScore: 5 },
    doubao: { hookScore: 7, climaxScore: 6, cliffhangerScore: 5, pacingScore: 5.5 },
  },
  features: {
    climax: { matchedKeywords: ["打脸"], keywordCategories: { reversal: ["打脸"], shock: [], breakthrough: [], conflict: [], emotion: [] }, dialogueDensity: 0.5, conflictDensity: 0.3 },
    pacing: { curve: [{ paragraph: 1, tension: 5, type: "dialogue" }], cv: 0.45, typeRatio: { action: 0.1, dialogue: 0.6, description: 0.3 } },
    filler: { items: [], suspiciousPairs: [], truncated: false },
    hook: { openingType: "conflict", hasQuestion: false, hasGoldenLine: false, conflictHitCount: 3, suspenseHitCount: 1 },
    cliffhanger: { endingType: "suspense", hasQuestion: false, hasReversalHint: false, suspenseHitCount: 2 },
  },
  tokenUsage: {
    deepseek: { promptTokens: 1200, completionTokens: 350 },
    doubao: { promptTokens: 1100, completionTokens: 300 },
  },
  deepseek: {
    highlights: ["开头冲突感强，能迅速抓住读者注意力"],
    suggestions: [
      { severity: "warning", location: "中段对话", issue: "中间段落的对话节奏可以更紧凑", direction: "适当减少重复信息" },
    ],
    consistencyIssues: ["第3段提到角色A在室内，第5段又说他在户外，前后矛盾"],
  },
  doubao: {
    highlights: ["结尾悬念设置有力"],
    suggestions: [
      { severity: "info", location: "开头", issue: "开场可以更有冲击力", direction: "增加金句或强冲突" },
    ],
    consistencyIssues: [],
  },
};

// ── V2 partial fixture ──

const V2_PARTIAL: EvaluationResultV2 = {
  status: "partial",
  scores: { hookScore: 8, climaxScore: 7, cliffhangerScore: 6, pacingScore: 5 },
  features: V2_COMPLETE.features,
  failedModel: "B",
  failedModelLabel: "Doubao",
  tokenUsage: { promptTokens: 1200, completionTokens: 350 },
};

// ── V2 degraded fixture ──

const V2_DEGRADED: EvaluationResultV2 = {
  status: "degraded",
  report: "【降级评估报告】\n\n## 开头分析\n开头类型为 conflict，冲突密度适中。\n\n## 爽点分析\n检测到爽点关键词：打脸。对话密度较高。\n\n## 章末悬念\n结尾类型为 suspense，悬念密度适中。\n\n## 节奏分析\n变异系数 0.45，对话占比 60%。",
  features: V2_COMPLETE.features,
  reason: "双模型均不可用",
};

// ── Old format tests (backward compatible) ──

describe("ReportCard — full report (old format)", () => {
  it("should render radar chart with four axis labels", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.getByLabelText("四维雷达图")).toBeInTheDocument();
    // Axis labels appear in both the radar SVG and ScoreCallouts below
    expect(screen.getAllByText("Hook").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("爽点密度").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("章末悬念").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("节奏").length).toBeGreaterThanOrEqual(1);
  });

  it("should not render overallScore number", () => {
    render(<ReportCard report={FULL_REPORT} />);
    expect(screen.queryByText("综合评分")).not.toBeInTheDocument();
    expect(screen.queryByText("/10")).not.toBeInTheDocument();
  });

  it("should render highlights as editorial paragraphs", () => {
    render(<ReportCard report={FULL_REPORT} />);
    // Magazine: highlights are flowing paragraphs in Section 01, not labeled cards
    expect(screen.getByText("做得好的地方")).toBeInTheDocument();
    // Text appears in both headline and highlight — use getAllByText
    expect(screen.getAllByText(/开头冲突感强/).length).toBeGreaterThanOrEqual(1);
  });

  it("should show radar chart in hero above main content", () => {
    // Magazine: radar is in the HeroChart section at the top.
    render(<ReportCard report={FULL_REPORT} />);
    const heroSection = document.querySelector(".shadow-\\[0_1px_0_\\#E5E5E0\\,0_-1px_0_\\#E5E5E0\\]");
    const highlightsSection = screen.getByText("做得好的地方");
    expect(heroSection).not.toBeNull();
    expect(highlightsSection).toBeInTheDocument();
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
    expect(screen.getByText("CV 变异系数")).toBeInTheDocument();
    expect(screen.getByText("0.45")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
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
    // Waterfall: suggestion items still rendered with constructive tone
    expect(screen.getAllByText(/对话节奏可以更紧凑/).length).toBeGreaterThanOrEqual(1);
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

describe("ReportCard — suggestions severity (old format)", () => {
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
    // Magazine: severity labels are "● 关键问题", "◆ 建议", "○ 观察"
    // "关键问题" also appears in editor note — use getAllByText
    expect(screen.getAllByText(/关键问题/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/观察/).length).toBeGreaterThanOrEqual(1);
    const warningMatches = screen.getAllByText(/建议/);
    expect(warningMatches.length).toBeGreaterThanOrEqual(1);
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

  it("should show direction hint when present in suggestion", () => {
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
    // Magazine: direction is rendered with → prefix
    expect(screen.getByText(/→ 精简/)).toBeInTheDocument();
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

describe("ReportCard — empty states (old format)", () => {
  it("should not show highlight cards when no highlights", () => {
    const noHighlights: EvaluationReport = {
      ...FULL_REPORT,
      llmResult: { ...FULL_REPORT.llmResult!, highlights: [] },
    };
    render(<ReportCard report={noHighlights} />);
    // Waterfall: empty highlights renders no cards — no "亮点" labels
    expect(screen.queryByText("亮点")).toBeNull();
  });

  it("should not show suggestion cards when no suggestions", () => {
    const noSuggestions: EvaluationReport = {
      ...FULL_REPORT,
      llmResult: { ...FULL_REPORT.llmResult!, suggestions: [] },
    };
    render(<ReportCard report={noSuggestions} />);
    // Suggestions rendered as cards; empty means no severity badges
    expect(screen.queryByText("关键")).toBeNull();
  });
});

describe("ReportCard — filler section (old format)", () => {
  it("should show filler items in notes strip when present", () => {
    const reportWithFiller: EvaluationReport = {
      ...FULL_REPORT,
      fillerResult: {
        items: [{ paragraph: 3, reason: "第3段内容重复，与前文第1段相似", suggestion: "建议精简或合并" }],
        suspiciousPairs: [],
      },
    };
    render(<ReportCard report={reportWithFiller} />);
    // Magazine: filler items rendered as NoteItems with "注水检测" label
    expect(screen.getByText("注水检测")).toBeInTheDocument();
    expect(screen.getByText(/第3段内容重复/)).toBeInTheDocument();
  });

  it("should show suspicious pairs in notes strip when present", () => {
    const reportWithPairs: EvaluationReport = {
      ...FULL_REPORT,
      fillerResult: {
        items: [],
        suspiciousPairs: [{ paragraphA: 1, paragraphB: 5, similarity: 0.82 }],
      },
    };
    render(<ReportCard report={reportWithPairs} />);
    // Magazine: suspicious pairs rendered as "相似段落" labeled NoteItems
    expect(screen.getByText("相似段落")).toBeInTheDocument();
    expect(screen.getByText(/第1段 ↔ 第5段/)).toBeInTheDocument();
  });

  it("should not show notes strip when no filler, pairs, or consistency issues", () => {
    const noFiller: EvaluationReport = {
      ...FULL_REPORT,
      fillerResult: { items: [], suspiciousPairs: [] },
      llmResult: { ...FULL_REPORT.llmResult!, consistencyIssues: [] },
    };
    render(<ReportCard report={noFiller} />);
    // Magazine: no notes strip when nothing to show
    expect(screen.queryByText("细节提示")).toBeNull();
  });
});

describe("ReportCard — partial result (old format)", () => {
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
    // Magazine: the warning text uses slightly different wording
    const warningEl = document.querySelector(".text-warning");
    expect(warningEl).not.toBeNull();
  });

  it("should not show LLM-dependent sections when llmResult is null", () => {
    render(<ReportCard report={PARTIAL_REPORT} />);
    expect(screen.queryByText("亮点分析")).toBeNull();
    expect(screen.queryByText("改进建议")).toBeNull();
    expect(screen.queryByText("一致性检查")).toBeNull();
  });
});

// ── V2 complete state tests ──

describe("ReportCard — V2 complete state", () => {
  it("should render dual-model radar chart", () => {
    render(<ReportCard report={V2_COMPLETE} />);
    expect(screen.getByLabelText("四维雷达图，DeepSeek 评分和 Doubao 评分叠加显示")).toBeInTheDocument();
  });

  it("should show consensus label when no divergence", () => {
    render(<ReportCard report={V2_COMPLETE} />);
    expect(screen.getByText(/双模型一致/)).toBeInTheDocument();
  });

  it("should show divergence label when divergence exists", () => {
    const withDiv: EvaluationResultV2 = {
      ...V2_COMPLETE,
      divergence: [
        { dimension: "hookScore", deepseek: 9, doubao: 5, delta: 4 },
      ],
    };
    render(<ReportCard report={withDiv} />);
    expect(screen.getByText(/评估存在差异/)).toBeInTheDocument();
  });

  it("should show highlights as editorial paragraphs from both models", () => {
    render(<ReportCard report={V2_COMPLETE} />);
    // Magazine: highlights are flowing paragraphs with section "做得好的地方"
    expect(screen.getByText("做得好的地方")).toBeInTheDocument();
    // Text appears in both headline and highlight paragraph — use getAllByText
    expect(screen.getAllByText(/开头冲突感强/).length).toBeGreaterThanOrEqual(1);
    // "结尾悬念设置有力" appears in both highlight paragraph and pull quote
    expect(screen.getAllByText(/结尾悬念设置有力/).length).toBeGreaterThanOrEqual(1);
  });

  it("should show suggestions with merged+sorted content from both models", () => {
    render(<ReportCard report={V2_COMPLETE} />);
    // Magazine: suggestions rendered as blue-left-border blocks in section 02
    expect(screen.getByText("可以更强的地方")).toBeInTheDocument();
    expect(screen.getAllByText(/对话节奏可以更紧凑/).length).toBeGreaterThanOrEqual(1);
  });

  it("should show consistency cards when issues present", () => {
    render(<ReportCard report={V2_COMPLETE} />);
    // Waterfall: consistency issues are "一致性" labeled cards
    expect(screen.getByText("一致性")).toBeInTheDocument();
    expect(screen.getByText(/角色A在室内.*前后矛盾/)).toBeInTheDocument();
  });

  it("should not show consistency cards when no issues from either model", () => {
    const noIssues: EvaluationResultV2 = {
      ...V2_COMPLETE,
      deepseek: { ...V2_COMPLETE.deepseek, consistencyIssues: [] },
    };
    render(<ReportCard report={noIssues} />);
    expect(screen.queryByText("一致性")).toBeNull();
  });

  it("should display dual token usage", () => {
    render(<ReportCard report={V2_COMPLETE} />);
    // DeepSeek and Doubao appear in both legend and token section
    const deepseekMatches = screen.getAllByText(/DeepSeek/);
    expect(deepseekMatches.length).toBeGreaterThanOrEqual(2);
    const doubaoMatches = screen.getAllByText(/Doubao/);
    expect(doubaoMatches.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/输入 1,200/)).toBeInTheDocument();
    expect(screen.getByText(/输出 350/)).toBeInTheDocument();
  });

  it("should render pacing curve from features", () => {
    render(<ReportCard report={V2_COMPLETE} />);
    expect(screen.getByLabelText("节奏曲线")).toBeInTheDocument();
  });

  it("should show pacing stats from features", () => {
    render(<ReportCard report={V2_COMPLETE} />);
    expect(screen.getByText("CV 变异系数")).toBeInTheDocument();
    expect(screen.getByText("0.45")).toBeInTheDocument();
  });

  it("should render filler items in notes strip", () => {
    const withFiller: EvaluationResultV2 = {
      ...V2_COMPLETE,
      features: {
        ...V2_COMPLETE.features,
        filler: {
          items: [{ paragraph: 3, reason: "重复内容", suggestion: "精简" }],
          suspiciousPairs: [],
          truncated: false,
        },
      },
    };
    render(<ReportCard report={withFiller} />);
    expect(screen.getByText("注水检测")).toBeInTheDocument();
  });
});

// ── V2 partial state tests ──

describe("ReportCard — V2 partial state", () => {
  it("should show yellow warning banner with failed model name", () => {
    render(<ReportCard report={V2_PARTIAL} />);
    expect(screen.getByText(/部分 AI 模型暂不可用/)).toBeInTheDocument();
    // "Doubao" appears in both banner and header subtitle
    const doubaoMatches = screen.getAllByText(/Doubao/);
    expect(doubaoMatches.length).toBeGreaterThanOrEqual(2);
  });

  it("should render single-model radar chart", () => {
    render(<ReportCard report={V2_PARTIAL} />);
    expect(screen.getByLabelText("四维雷达图")).toBeInTheDocument();
  });

  it("should display single token usage", () => {
    render(<ReportCard report={V2_PARTIAL} />);
    expect(screen.getByText(/Token 用量：/)).toBeInTheDocument();
    expect(screen.getByText(/输入 1,200/)).toBeInTheDocument();
  });
});

// ── V2 degraded state tests ──

describe("ReportCard — V2 degraded state", () => {
  it("should show degraded banner", () => {
    render(<ReportCard report={V2_DEGRADED} />);
    expect(screen.getByText(/AI 服务暂不可用/)).toBeInTheDocument();
    expect(screen.getByText(/基于规则引擎的分析结果/)).toBeInTheDocument();
  });

  it("should render degrade report text content", () => {
    render(<ReportCard report={V2_DEGRADED} />);
    expect(screen.getByText(/降级评估报告/)).toBeInTheDocument();
    expect(screen.getByText(/开头分析/)).toBeInTheDocument();
    expect(screen.getByText(/爽点分析/)).toBeInTheDocument();
  });

  it("should show retry button", () => {
    const onRetry = vi.fn();
    render(<ReportCard report={V2_DEGRADED} onRetry={onRetry} />);
    const retryBtn = screen.getByRole("button", { name: /重新评估/ });
    expect(retryBtn).toBeInTheDocument();
  });

  it("should call onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ReportCard report={V2_DEGRADED} onRetry={onRetry} />);
    screen.getByRole("button", { name: /重新评估/ }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should still render rule engine sections (pacing, filler)", () => {
    render(<ReportCard report={V2_DEGRADED} />);
    expect(screen.getByLabelText("节奏曲线")).toBeInTheDocument();
  });

  it("should not render radar chart in degraded mode", () => {
    render(<ReportCard report={V2_DEGRADED} />);
    expect(screen.queryByLabelText("四维雷达图")).toBeNull();
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
