import { PacingCurve } from "./PacingCurve";
import { RadarChart } from "./RadarChart";

export interface SuggestionItem {
  severity: "critical" | "warning" | "info";
  location: string;
  issue: string;
  direction: string;
}

export interface EvaluationReport {
  reportId: string;
  scores: {
    hookScore: number;
    climaxScore: number;
    cliffhangerScore: number;
    pacingScore: number;
  };
  climaxResult: {
    score: number;
    matchedKeywords: string[];
    keywordCategories: Record<string, string[]>;
    dialogueDensity: number;
    conflictDensity: number;
  };
  pacingResult: {
    score: number;
    curve: { paragraph: number; tension: number; type: string }[];
    cv: number;
    typeRatio: { action: number; dialogue: number; description: number };
  };
  fillerResult: {
    items: { paragraph: number; reason: string; suggestion: string }[];
    suspiciousPairs: { paragraphA: number; paragraphB: number; similarity: number }[];
  };
  hookResult?: {
    score: number;
    openingType: string;
    hasQuestion: boolean;
    hasGoldenLine: boolean;
  } | null;
  cliffhangerResult?: {
    score: number;
    endingType: string;
    hasQuestion: boolean;
    hasReversalHint: boolean;
  } | null;
  llmResult: {
    hookScore: number;
    climaxScore: number;
    cliffhangerScore: number;
    pacingScore: number;
    consistencyIssues: string[];
    highlights: string[];
    suggestions: SuggestionItem[] | string[];
  } | null;
  isPartial: boolean;
  hookSource?: "llm" | "rule";
  cliffhangerSource?: "llm" | "rule";
  tokenUsage?: { promptTokens: number; completionTokens: number } | null;
  costEstimate?: number | null;
}

function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="font-display text-lg text-text mt-8 mb-3 italic">
      {children}
    </h3>
  );
}

const SEVERITY_CONFIG = {
  critical: { label: "关键", badge: "bg-error/10 text-error border-error/30", icon: "●" },
  warning: { label: "建议", badge: "bg-warning-bg text-warning border-warning/30", icon: "◆" },
  info: { label: "观察", badge: "bg-primary-lighter/10 text-primary-light border-primary-lighter/30", icon: "○" },
} as const;

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

function normalizeSuggestions(raw: (SuggestionItem | string)[]): SuggestionItem[] {
  return raw.map((s) => {
    if (typeof s === "string") {
      return { severity: "info" as const, location: "", issue: s, direction: "" };
    }
    if (typeof s === "object" && s !== null) {
      const obj = s as unknown as Record<string, unknown>;
      return {
        severity: (["critical", "warning", "info"].includes(obj.severity as string)
          ? obj.severity
          : "info") as SuggestionItem["severity"],
        location: typeof obj.location === "string" ? obj.location : "",
        issue: typeof obj.issue === "string" ? obj.issue : "",
        direction: typeof obj.direction === "string" ? obj.direction : "",
      };
    }
    return { severity: "info" as const, location: "", issue: String(s), direction: "" };
  });
}

function sortSuggestions(suggestions: SuggestionItem[]): SuggestionItem[] {
  return [...suggestions].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );
}

export function ReportCard({ report }: { report: EvaluationReport }) {
  const { scores, llmResult, isPartial } = report;
  const hasLLM = llmResult !== null;
  const hasRuleFallback = report.hookSource === "rule" || report.cliffhangerSource === "rule";

  const sortedSuggestions = llmResult ? sortSuggestions(normalizeSuggestions(llmResult.suggestions)) : [];
  const hasFiller = report.fillerResult.items.length > 0 || report.fillerResult.suspiciousPairs.length > 0;

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Partial-result Banner */}
      {isPartial && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-warning-bg border border-warning/30 rounded-md text-sm text-warning">
          <span>⚠</span>
          <span>部分评估结果 — LLM 评估未完成，以下数据基于规则引擎分析，仅供参考</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display text-2xl text-text">评估报告</h2>
        <p className="text-xs text-text-muted font-mono mt-1">
          {report.reportId}
          {isPartial && " · 部分结果"}
        </p>
      </div>

      {/* ── 区域 1: 亮点分析（优点优先）── */}
      {hasLLM && (
        <div className="p-5 bg-surface rounded-lg border border-border">
          <h3 className="font-display text-base text-text mb-3">亮点分析</h3>
          {llmResult.highlights.length > 0 ? (
            <ul className="space-y-2">
              {llmResult.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm px-3 py-2 bg-success-bg border border-success/20 rounded-md text-text-secondary">
                  <span className="mt-0.5 shrink-0 text-success">●</span>
                  {h}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted italic">规则引擎未检测到显著亮点</p>
          )}
        </div>
      )}

      {/* ── 区域 2: 改进建议（按严重度分级）── */}
      {hasLLM && (
        <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
          <h3 className="font-display text-base text-text mb-3">改进建议</h3>
          {sortedSuggestions.length > 0 ? (
            <ul className="space-y-3">
              {sortedSuggestions.map((s, i) => {
                const cfg = SEVERITY_CONFIG[s.severity];
                return (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span
                      className={`mt-0.5 shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${cfg.badge}`}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                    <div className="text-text-secondary">
                      {s.location && (
                        <span className="text-text-muted text-xs mr-1">[{s.location}]</span>
                      )}
                      <span>{s.issue}</span>
                      {s.direction && (
                        <span className="block mt-0.5 text-xs text-text-muted">
                          → {s.direction}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-text-muted italic">未发现明显问题</p>
          )}
        </div>
      )}

      {/* ── 区域 3: 四维雷达图（辅助信息）── */}
      <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
        <h3 className="font-display text-base text-text mb-3">四维评分</h3>
        <RadarChart
          hook={scores.hookScore}
          climax={scores.climaxScore}
          cliffhanger={scores.cliffhangerScore}
          pacing={scores.pacingScore}
        />
        {hasRuleFallback && (
          <p className="mt-3 text-center text-[11px] text-warning">
            ⚠ 部分维度使用规则引擎参考分（AI 深度分析未完成）
          </p>
        )}
      </div>

      {/* ── 区域 4: 节奏曲线 ── */}
      {report.pacingResult.curve.length > 0 && (
        <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
          <h3 className="font-display text-base text-text mb-3">节奏曲线</h3>
          <PacingCurve
            data={report.pacingResult.curve.map((p) => ({
              paragraph: p.paragraph,
              tension: p.tension,
              type: p.type as "action" | "dialogue" | "description",
            }))}
          />
          <div className="mt-5 grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-bg rounded-md border border-border-light">
              <p className="text-xs text-text-muted mb-1">变异系数 CV</p>
              <p className="font-mono text-base font-medium text-text">{report.pacingResult.cv.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-bg rounded-md border border-border-light">
              <p className="text-xs text-text-muted mb-1">动作占比</p>
              <p className="font-mono text-base font-medium text-text">{(report.pacingResult.typeRatio.action * 100).toFixed(0)}%</p>
            </div>
            <div className="text-center p-3 bg-bg rounded-md border border-border-light">
              <p className="text-xs text-text-muted mb-1">对话占比</p>
              <p className="font-mono text-base font-medium text-text">{(report.pacingResult.typeRatio.dialogue * 100).toFixed(0)}%</p>
            </div>
            <div className="text-center p-3 bg-bg rounded-md border border-border-light">
              <p className="text-xs text-text-muted mb-1">描写占比</p>
              <p className="font-mono text-base font-medium text-text">{(report.pacingResult.typeRatio.description * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 区域 5: 注水检测 ── */}
      {hasFiller && (
        <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
          <h3 className="font-display text-base text-text mb-3">注水检测</h3>
          {report.fillerResult.items.length > 0 ? (
            <ul className="space-y-2">
              {report.fillerResult.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm px-3 py-2 bg-warning-bg border border-warning/20 rounded-md text-text-secondary">
                  <span className="mt-0.5 shrink-0 text-warning">●</span>
                  <div>
                    <span className="text-xs text-text-muted">第{item.paragraph}段：</span>
                    {item.reason}
                    {item.suggestion && (
                      <span className="block mt-0.5 text-xs text-text-muted">→ {item.suggestion}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted italic">未检测到明显注水段落</p>
          )}
          {report.fillerResult.suspiciousPairs.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-text-muted mb-2">可疑相似段落对：</p>
              <ul className="space-y-1">
                {report.fillerResult.suspiciousPairs.map((pair, i) => (
                  <li key={i} className="text-xs text-text-muted font-mono">
                    第{pair.paragraphA}段 ↔ 第{pair.paragraphB}段 (相似度: {Math.round(pair.similarity * 100)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── 区域 6: 一致性检查 ── */}
      {hasLLM && llmResult.consistencyIssues.length > 0 && (
        <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
          <h3 className="font-display text-base text-text mb-3">一致性检查</h3>
          <ul className="space-y-2">
            {llmResult.consistencyIssues.map((issue, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm pl-3 py-1 border-l-2 border-warning text-text-secondary"
              >
                <span className="mt-0.5 shrink-0 text-warning">⚠</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 区域 7: Token 用量 + 成本（小字，不干扰主视觉）── */}
      {report.tokenUsage && (
        <div className="mt-10 pt-4 border-t border-border text-xs text-text-muted font-mono">
          <span>
            Token 用量：输入 {formatNumber(report.tokenUsage.promptTokens)} + 输出 {formatNumber(report.tokenUsage.completionTokens)}
          </span>
          {report.costEstimate != null && (
            <span className="ml-4">
              预估成本：¥{report.costEstimate.toFixed(4)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** 空状态：引导卡片 */
export function EmptyReport() {
  return (
    <div className="max-w-lg mx-auto p-8">
      <div className="text-center p-12 bg-surface rounded-lg border border-border">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="font-display text-xl text-text mb-2">开始评估</h3>
        <p className="text-sm text-text-muted">
          输入章节文本并点击「开始评估」，获取 AI 写作质量分析报告
        </p>
      </div>
    </div>
  );
}

/** 错误状态：红色卡片 + 重试按钮 */
export function ErrorReport({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto p-8">
      <div className="p-6 bg-error-bg border border-error rounded-lg text-center">
        <div className="text-3xl mb-3">⚠</div>
        <p className="text-error font-medium">评估失败</p>
        <p className="mt-1 text-sm text-text-secondary">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-6 py-2 bg-error text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
        >
          重试
        </button>
      </div>
    </div>
  );
}
