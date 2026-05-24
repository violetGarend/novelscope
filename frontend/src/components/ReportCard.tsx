import { PacingCurve } from "./PacingCurve";
import { RadarChart } from "./RadarChart";
import type { EvaluationResultV2, DivergenceItem, SuggestionItem as V2SuggestionItem } from "../types/evaluation";

// ── Old format types (backward compatible) ──

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

export type ReportData = EvaluationReport | EvaluationResultV2;

function isV2(report: ReportData): report is EvaluationResultV2 {
  return "status" in report && (report.status === "complete" || report.status === "partial" || report.status === "degraded");
}

// ── Helpers ──

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

function divKeyToLabel(key: string): string {
  const map: Record<string, string> = {
    hookScore: "Hook",
    climaxScore: "爽点密度",
    cliffhangerScore: "章末悬念",
    pacingScore: "节奏",
  };
  return map[key] ?? key;
}

// ── Shared sub-components ──

interface PacingSectionProps {
  curve: { paragraph: number; tension: number; type: string }[];
  cv: number;
  typeRatio: { action: number; dialogue: number; description: number };
}

function PacingSection({ curve, cv, typeRatio }: PacingSectionProps) {
  if (curve.length === 0) return null;
  return (
    <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
      <h3 className="font-display text-base text-text mb-3">节奏曲线</h3>
      <PacingCurve
        data={curve.map((p) => ({
          paragraph: p.paragraph,
          tension: p.tension,
          type: p.type as "action" | "dialogue" | "description",
        }))}
      />
      <div className="mt-5 grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-bg rounded-md border border-border-light">
          <p className="text-xs text-text-muted mb-1">变异系数 CV</p>
          <p className="font-mono text-base font-medium text-text">{cv.toFixed(2)}</p>
        </div>
        <div className="text-center p-3 bg-bg rounded-md border border-border-light">
          <p className="text-xs text-text-muted mb-1">动作占比</p>
          <p className="font-mono text-base font-medium text-text">{(typeRatio.action * 100).toFixed(0)}%</p>
        </div>
        <div className="text-center p-3 bg-bg rounded-md border border-border-light">
          <p className="text-xs text-text-muted mb-1">对话占比</p>
          <p className="font-mono text-base font-medium text-text">{(typeRatio.dialogue * 100).toFixed(0)}%</p>
        </div>
        <div className="text-center p-3 bg-bg rounded-md border border-border-light">
          <p className="text-xs text-text-muted mb-1">描写占比</p>
          <p className="font-mono text-base font-medium text-text">{(typeRatio.description * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}

interface FillerSectionProps {
  items: { paragraph: number; reason: string; suggestion: string }[];
  suspiciousPairs: { paragraphA: number; paragraphB: number; similarity: number }[];
}

function FillerSection({ items, suspiciousPairs }: FillerSectionProps) {
  const hasFiller = items.length > 0 || suspiciousPairs.length > 0;
  if (!hasFiller) return null;

  return (
    <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
      <h3 className="font-display text-base text-text mb-3">注水检测</h3>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, i) => (
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
      {suspiciousPairs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-text-muted mb-2">可疑相似段落对：</p>
          <ul className="space-y-1">
            {suspiciousPairs.map((pair, i) => (
              <li key={i} className="text-xs text-text-muted font-mono">
                第{pair.paragraphA}段 ↔ 第{pair.paragraphB}段 (相似度: {Math.round(pair.similarity * 100)}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DivergenceTooltip({ item }: { item: DivergenceItem }) {
  return (
    <span className="group relative inline-block ml-0.5 text-warning cursor-help" title={`DeepSeek: ${item.deepseek} / Doubao: ${item.doubao} (差值 ${item.delta})`}>
      ⚠
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-text text-white text-[10px] px-2 py-1 rounded shadow-md z-10 font-mono">
        DeepSeek: {item.deepseek} / Doubao: {item.doubao} (差值 {item.delta})
      </span>
    </span>
  );
}

// ── Old format renderer ──

function OldReport({ report }: { report: EvaluationReport }) {
  const { scores, llmResult, isPartial } = report;
  const hasLLM = llmResult !== null;
  const hasRuleFallback = report.hookSource === "rule" || report.cliffhangerSource === "rule";

  const sortedSuggestions = llmResult ? sortSuggestions(normalizeSuggestions(llmResult.suggestions)) : [];

  return (
    <div className="max-w-2xl mx-auto p-8">
      {isPartial && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-warning-bg border border-warning/30 rounded-md text-sm text-warning">
          <span>⚠</span>
          <span>部分评估结果 — LLM 评估未完成，以下数据基于规则引擎分析，仅供参考</span>
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-display text-2xl text-text">评估报告</h2>
        <p className="text-xs text-text-muted font-mono mt-1">
          {report.reportId}
          {isPartial && " · 部分结果"}
        </p>
      </div>

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

      <PacingSection
        curve={report.pacingResult.curve}
        cv={report.pacingResult.cv}
        typeRatio={report.pacingResult.typeRatio}
      />

      <FillerSection
        items={report.fillerResult.items}
        suspiciousPairs={report.fillerResult.suspiciousPairs}
      />

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

// ── V2 Complete renderer ──

function mergeHighlights(deepseek: string[], doubao: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const h of [...deepseek, ...doubao]) {
    const key = h.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(h);
    }
  }
  return merged;
}

function mergeSuggestions(deepseek: V2SuggestionItem[], doubao: V2SuggestionItem[]): V2SuggestionItem[] {
  const seen = new Set<string>();
  const merged: V2SuggestionItem[] = [];
  for (const s of [...deepseek, ...doubao]) {
    const key = `${s.severity}:${s.issue.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(s);
    }
  }
  return sortSuggestions(merged);
}

function mergeConsistencyIssues(deepseek: string[], doubao: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const issue of [...deepseek, ...doubao]) {
    const key = issue.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(issue);
    }
  }
  return merged;
}

function V2CompleteReport({ report }: { report: EvaluationResultV2 & { status: "complete" } }) {
  const { scores, features, tokenUsage, divergence, deepseek, doubao } = report;
  const hasDivergence = divergence && divergence.length > 0;
  const divergenceDimKeys = divergence?.map((d) => d.dimension) ?? [];

  const allHighlights = mergeHighlights(deepseek.highlights, doubao.highlights);
  const allSuggestions = mergeSuggestions(deepseek.suggestions, doubao.suggestions);
  const allConsistencyIssues = mergeConsistencyIssues(deepseek.consistencyIssues, doubao.consistencyIssues);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl text-text">评估报告</h2>
        <div className="flex items-center gap-3 mt-2">
          {hasDivergence ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-warning-bg text-warning border border-warning/30">
              ⚠ 评估存在差异
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-success-bg text-success border border-success/20">
              ✓ 2 个 AI 评估一致
            </span>
          )}
        </div>
        {hasDivergence && (
          <div className="mt-2 space-y-1">
            {divergence!.map((d) => (
              <div key={d.dimension} className="flex items-center gap-2 text-xs text-text-muted">
                <DivergenceTooltip item={d} />
                <span className="font-mono">
                  {divKeyToLabel(d.dimension)}: DeepSeek {d.deepseek} vs Doubao {d.doubao} (差值 {d.delta})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 亮点分析（DeepSeek + 豆包 合并去重）── */}
      <div className="p-5 bg-surface rounded-lg border border-border">
        <h3 className="font-display text-base text-text mb-3">亮点分析</h3>
        {allHighlights.length > 0 ? (
          <ul className="space-y-2">
            {allHighlights.map((h, i) => (
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

      {/* ── 改进建议（两模型合并，去重，按严重度排序）── */}
      <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
        <h3 className="font-display text-base text-text mb-3">改进建议</h3>
        {allSuggestions.length > 0 ? (
          <ul className="space-y-3">
            {allSuggestions.map((s, i) => {
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

      {/* ── 四维雷达图 ── */}
      <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
        <h3 className="font-display text-base text-text mb-3">四维评分</h3>
        <RadarChart
          hook={scores.deepseek.hookScore}
          climax={scores.deepseek.climaxScore}
          cliffhanger={scores.deepseek.cliffhangerScore}
          pacing={scores.deepseek.pacingScore}
          modelName="DeepSeek"
          secondModel={{
            name: "Doubao",
            scores: {
              hook: scores.doubao.hookScore,
              climax: scores.doubao.climaxScore,
              cliffhanger: scores.doubao.cliffhangerScore,
              pacing: scores.doubao.pacingScore,
            },
            color: "#7C3AED",
            strokeDasharray: "6,4",
          }}
          divergenceDims={divergenceDimKeys.length > 0 ? divergenceDimKeys : undefined}
        />
      </div>

      <PacingSection
        curve={features.pacing.curve}
        cv={features.pacing.cv}
        typeRatio={features.pacing.typeRatio}
      />

      <FillerSection
        items={features.filler.items}
        suspiciousPairs={features.filler.suspiciousPairs}
      />

      {/* ── 一致性检查 ── */}
      {allConsistencyIssues.length > 0 && (
        <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
          <h3 className="font-display text-base text-text mb-3">一致性检查</h3>
          <ul className="space-y-2">
            {allConsistencyIssues.map((issue, i) => (
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

      {/* Dual token usage */}
      <div className="mt-10 pt-4 border-t border-border text-xs text-text-muted font-mono space-y-1">
        <div>
          DeepSeek — 输入 {formatNumber(tokenUsage.deepseek.promptTokens)} + 输出 {formatNumber(tokenUsage.deepseek.completionTokens)}
        </div>
        <div>
          Doubao — 输入 {formatNumber(tokenUsage.doubao.promptTokens)} + 输出 {formatNumber(tokenUsage.doubao.completionTokens)}
        </div>
      </div>
    </div>
  );
}

// ── V2 Partial renderer ──

function V2PartialReport({ report }: { report: EvaluationResultV2 & { status: "partial" } }) {
  const { scores, features, failedModelLabel, tokenUsage } = report;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-warning-bg border border-warning/30 rounded-md text-sm text-warning">
        <span>⚠</span>
        <span>部分 AI 模型暂不可用（{failedModelLabel} 评估超时），当前显示可用模型的评估结果</span>
      </div>

      <div className="mb-6">
        <h2 className="font-display text-2xl text-text">评估报告</h2>
        <p className="text-xs text-text-muted font-mono mt-1">部分结果 · {failedModelLabel} 不可用</p>
      </div>

      <div className="mt-4 p-5 bg-surface rounded-lg border border-border">
        <h3 className="font-display text-base text-text mb-3">四维评分</h3>
        <RadarChart
          hook={scores.hookScore}
          climax={scores.climaxScore}
          cliffhanger={scores.cliffhangerScore}
          pacing={scores.pacingScore}
        />
        <p className="mt-3 text-center text-[11px] text-warning">
          ⚠ {failedModelLabel} 评估超时，仅显示单一模型结果
        </p>
      </div>

      <PacingSection
        curve={features.pacing.curve}
        cv={features.pacing.cv}
        typeRatio={features.pacing.typeRatio}
      />

      <FillerSection
        items={features.filler.items}
        suspiciousPairs={features.filler.suspiciousPairs}
      />

      {tokenUsage && (
        <div className="mt-10 pt-4 border-t border-border text-xs text-text-muted font-mono">
          <span>
            Token 用量：输入 {formatNumber(tokenUsage.promptTokens)} + 输出 {formatNumber(tokenUsage.completionTokens)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── V2 Degraded renderer ──

function V2DegradedReport({ report, onRetry }: { report: EvaluationResultV2 & { status: "degraded" }; onRetry?: () => void }) {
  const { features } = report;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-error-bg border border-error/30 rounded-md text-sm text-error">
        <span>⚠</span>
        <span>AI 服务暂不可用，以下为基于规则引擎的分析结果</span>
      </div>

      <div className="mb-6">
        <h2 className="font-display text-2xl text-text">评估报告</h2>
        <p className="text-xs text-text-muted font-mono mt-1">降级评估 · 规则引擎分析</p>
      </div>

      {/* Degrade report text */}
      <div className="p-5 bg-surface rounded-lg border border-border">
        <h3 className="font-display text-base text-text mb-3">规则引擎分析</h3>
        <div className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
          {report.report}
        </div>
      </div>

      <PacingSection
        curve={features.pacing.curve}
        cv={features.pacing.cv}
        typeRatio={features.pacing.typeRatio}
      />

      <FillerSection
        items={features.filler.items}
        suspiciousPairs={features.filler.suspiciousPairs}
      />

      <div className="mt-10 text-center">
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-light transition-colors"
        >
          重新评估
        </button>
      </div>
    </div>
  );
}

// ── Main ReportCard component ──

export function ReportCard({ report, onRetry }: { report: ReportData; onRetry?: () => void }) {
  if (isV2(report)) {
    switch (report.status) {
      case "complete":
        return <V2CompleteReport report={report} />;
      case "partial":
        return <V2PartialReport report={report} />;
      case "degraded":
        return <V2DegradedReport report={report} onRetry={onRetry} />;
    }
  }

  return <OldReport report={report} />;
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
