import { ScoreBadge } from "./ScoreBadge";
import { PacingCurve } from "./PacingCurve";

export interface EvaluationReport {
  reportId: string;
  scores: {
    overallScore: number;
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
  llmResult: {
    hookScore: number;
    climaxScore: number;
    cliffhangerScore: number;
    pacingScore: number;
    consistencyIssues: string[];
    highlights: string[];
    suggestions: string[];
  } | null;
  isPartial: boolean;
  tokenUsage?: { promptTokens: number; completionTokens: number } | null;
  costEstimate?: number | null;
}

function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-score-high";
  if (score >= 5) return "text-score-mid";
  return "text-score-low";
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="font-display text-lg text-text mt-8 mb-3 italic">
      {children}
    </h3>
  );
}

export function ReportCard({ report }: { report: EvaluationReport }) {
  const { scores, llmResult, isPartial } = report;
  const overallColor = scoreColor(scores.overallScore);
  const hasLLM = llmResult !== null;

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

      {/* Overall Score */}
      <div className="p-8 bg-surface rounded-lg border border-border text-center">
        <p className="text-sm text-text-muted mb-2">综合评分</p>
        <p className={`font-mono text-6xl font-bold tabular-nums ${overallColor}`}>
          {scores.overallScore.toFixed(1)}
        </p>
        <p className="text-xs text-text-muted mt-1">/10</p>
      </div>

      {/* Sub-scores Grid */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="p-4 bg-surface rounded-lg border border-border text-center">
          <ScoreBadge score={scores.hookScore} label="Hook" />
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border text-center">
          <ScoreBadge score={scores.climaxScore} label="爽点密度" />
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border text-center">
          <ScoreBadge score={scores.cliffhangerScore} label="章末悬念" />
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border text-center">
          <ScoreBadge score={scores.pacingScore} label="节奏" />
        </div>
      </div>

      {/* Pacing Curve */}
      {report.pacingResult.curve.length > 0 && (
        <>
          <SectionHeading>节奏曲线</SectionHeading>
          <div className="p-4 bg-surface rounded-lg border border-border">
            <PacingCurve
              data={report.pacingResult.curve.map((p) => ({
                paragraph: p.paragraph,
                tension: p.tension,
                type: p.type as "action" | "dialogue" | "description",
              }))}
            />
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-text-muted">
              <span>
                变异系数 CV: <span className="font-mono text-text">{report.pacingResult.cv.toFixed(2)}</span>
              </span>
              <span>
                动作 <span className="font-mono text-text">{(report.pacingResult.typeRatio.action * 100).toFixed(0)}%</span>
              </span>
              <span>
                对话 <span className="font-mono text-text">{(report.pacingResult.typeRatio.dialogue * 100).toFixed(0)}%</span>
              </span>
              <span>
                描写 <span className="font-mono text-text">{(report.pacingResult.typeRatio.description * 100).toFixed(0)}%</span>
              </span>
            </div>
          </div>
        </>
      )}

      {/* Highlights — 优势先行 */}
      {hasLLM && llmResult.highlights.length > 0 && (
        <>
          <SectionHeading>亮点分析</SectionHeading>
          <ul className="space-y-2">
            {llmResult.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-0.5 shrink-0 text-success">●</span>
                {h}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Suggestions — 建设性语气 */}
      {hasLLM && llmResult.suggestions.length > 0 && (
        <>
          <SectionHeading>改进建议</SectionHeading>
          <ul className="space-y-2">
            {llmResult.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-0.5 shrink-0 text-primary-light">◆</span>
                {s}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Consistency Issues */}
      {hasLLM && llmResult.consistencyIssues.length > 0 && (
        <>
          <SectionHeading>一致性检查</SectionHeading>
          <ul className="space-y-2">
            {llmResult.consistencyIssues.map((issue, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm px-3 py-2 bg-warning-bg border border-warning/20 rounded-md text-text-secondary"
              >
                <span className="mt-0.5 shrink-0 text-warning">⚠</span>
                {issue}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Token Usage + Cost — 小字，不干扰主报告视觉层级 */}
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
