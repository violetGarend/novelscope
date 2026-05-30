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

const SEVERITY_CONFIG = {
  critical: { label: "关键问题", color: "text-error", icon: "●" },
  warning: { label: "建议", color: "text-warning", icon: "◆" },
  info: { label: "观察", color: "text-primary-light", icon: "○" },
} as const;

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

function normalizeSuggestions(raw: (SuggestionItem | string)[]): SuggestionItem[] {
  return raw.map((s) => {
    if (typeof s === "string") return { severity: "info" as const, location: "", issue: s, direction: "" };
    if (typeof s === "object" && s !== null) {
      const obj = s as unknown as Record<string, unknown>;
      return {
        severity: (["critical", "warning", "info"].includes(obj.severity as string) ? obj.severity : "info") as SuggestionItem["severity"],
        location: typeof obj.location === "string" ? obj.location : "",
        issue: typeof obj.issue === "string" ? obj.issue : "",
        direction: typeof obj.direction === "string" ? obj.direction : "",
      };
    }
    return { severity: "info" as const, location: "", issue: String(s), direction: "" };
  });
}

function sortSuggestions(suggestions: SuggestionItem[]): SuggestionItem[] {
  return [...suggestions].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99));
}

function divKeyToLabel(key: string): string {
  const map: Record<string, string> = {
    hookScore: "Hook", climaxScore: "爽点密度", cliffhangerScore: "章末悬念", pacingScore: "节奏",
  };
  return map[key] ?? key;
}

// ── V2 merge helpers ──

function mergeHighlights(deepseek: string[], doubao: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const h of [...deepseek, ...doubao]) {
    const key = h.trim().toLowerCase();
    if (!seen.has(key)) { seen.add(key); merged.push(h); }
  }
  return merged;
}

function mergeSuggestions(deepseek: V2SuggestionItem[], doubao: V2SuggestionItem[]): V2SuggestionItem[] {
  const seen = new Set<string>();
  const merged: V2SuggestionItem[] = [];
  for (const s of [...deepseek, ...doubao]) {
    const key = `${s.severity}:${s.issue.trim().toLowerCase()}`;
    if (!seen.has(key)) { seen.add(key); merged.push(s); }
  }
  return sortSuggestions(merged);
}

function mergeConsistencyIssues(deepseek: string[], doubao: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const issue of [...deepseek, ...doubao]) {
    const key = issue.trim().toLowerCase();
    if (!seen.has(key)) { seen.add(key); merged.push(issue); }
  }
  return merged;
}

// ── Magazine editorial components ──

function Article({ children }: { children: React.ReactNode }) {
  return <article className="max-w-[1000px] mx-auto px-10 py-16">{children}</article>;
}

function Kicker() {
  return <div className="font-mono text-[11px] text-text-muted uppercase tracking-[2px] mb-4">NovelScope · 章节评估</div>;
}

function Headline({ text }: { text: string }) {
  return <h1 className="font-display italic text-[52px] leading-[1.08] text-text mb-2 -tracking-[0.5px]">{text}</h1>;
}

function Deck({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] text-text-secondary leading-relaxed max-w-[620px] mb-12">{children}</p>;
}

function Meta({ reportId, consensusOk, children }: { reportId: string; consensusOk?: boolean; children?: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] text-text-muted mb-14">
      {reportId}
      {consensusOk !== undefined && (
        <span className={`inline-flex items-center gap-1.5 ml-3 px-3 py-1 rounded-full text-[11px] font-medium font-sans ${
          consensusOk ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
        }`}>
          {consensusOk ? "✓ 双模型一致" : "⚠ 评估存在差异"}
        </span>
      )}
      {children}
    </div>
  );
}

function HeroChart({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-[2px] py-12 px-12 mb-14 shadow-[0_1px_0_#E5E5E0,0_-1px_0_#E5E5E0]">
      <div className="flex items-center gap-16 justify-center">
        {children}
      </div>
    </section>
  );
}

function ScoreCallouts({ scores, divergenceDims }: {
  scores: { hook: number; climax: number; cliffhanger: number; pacing: number };
  divergenceDims?: string[];
}) {
  const dims = divergenceDims ?? [];
  const items = [
    { key: "hook", label: "Hook 强度", score: scores.hook },
    { key: "climax", label: "爽点密度", score: scores.climax },
    { key: "cliffhanger", label: "章末悬念", score: scores.cliffhanger },
    { key: "pacing", label: "叙事节奏", score: scores.pacing },
  ];
  return (
    <div className="flex gap-10">
      {items.map((item) => {
        const color = item.score >= 7 ? "text-success" : item.score >= 5 ? "text-warning" : "text-error";
        return (
          <div key={item.key} className="text-center">
            <div className={`font-mono text-[48px] font-normal leading-none -tracking-[2px] ${color}`}>{item.score}</div>
            <div className="text-xs text-text-muted mt-1.5 uppercase tracking-[1px]">
              {item.label}
              {dims.includes(item.key) && <span className="text-warning ml-0.5">⚠</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionNum({ n }: { n: string }) {
  return <div className="font-mono text-[11px] text-text-muted tracking-[1px] mb-1">{n}</div>;
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-display italic text-[30px] leading-tight text-text mb-8 pb-4 border-b border-border-light">{children}</h2>;
}

function Cols({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-14 items-start mb-14">{children}</div>;
}

function MainCol({ children }: { children: React.ReactNode }) {
  return <div className="flex-[7] text-[15px] leading-relaxed text-[#3D3D3D] space-y-5">{children}</div>;
}

function SideCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-[2] text-[13px] leading-relaxed text-text-secondary bg-[#F8F7F4] rounded-lg p-5 border border-border-light">
      <p className="text-text-muted text-[11px] uppercase tracking-[1px] mb-4">{title}</p>
      {children}
    </div>
  );
}
const HIGHLIGHT_CATEGORIES = [
  { key: "hook", keywords: ["开头", "开篇", "开场", "第一", "hook", "抓住", "冲突感", "迅速"], color: "#3B82F6", bg: "bg-primary-bg/40", textColor: "text-primary-light", labels: ["开篇有力", "抓人开头", "黄金三章"] },
  { key: "dialogue", keywords: ["对话", "对白", "角色", "声音", "人物", "台词"], color: "#7C3AED", bg: "bg-purple-50/60", textColor: "text-[#7C3AED]", labels: ["角色鲜活", "对白出彩", "声音分明"] },
  { key: "pacing", keywords: ["节奏", "流畅", "紧凑", "结构", "张力"], color: "#059669", bg: "bg-success-bg/30", textColor: "text-success", labels: ["节奏得当", "张弛有度", "行文流畅"] },
  { key: "emotion", keywords: ["情感", "情绪", "共鸣", "温暖", "感动", "温馨", "温情"], color: "#0891B2", bg: "bg-cyan-50/60", textColor: "text-[#0891B2]", labels: ["情感共鸣", "打动人心", "共情时刻"] },
  { key: "climax", keywords: ["爽点", "转折", "悬念", "反转", "高潮", "结尾", "章末", "系统", "金手指", "释放"], color: "#059669", bg: "bg-success-bg/30", textColor: "text-success", labels: ["爽点到位", "转折有力", "追读动力"] },
];

function classifyHighlight(text: string): { color: string; bg: string; textColor: string; label: string } {
  const lower = text.toLowerCase();
  for (const cat of HIGHLIGHT_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) {
        return { color: cat.color, bg: cat.bg, textColor: cat.textColor, label: cat.key };
      }
    }
  }
  return { color: "#1E40AF", bg: "bg-primary-bg/40", textColor: "text-primary", label: "亮点" };
}

function pickLabel(catKey: string, index: number): string {
  const cat = HIGHLIGHT_CATEGORIES.find((c) => c.key === catKey);
  if (cat) return cat.labels[index % cat.labels.length];
  return "亮点";
}

function HighlightParagraph({ text, index, catKey }: { text: string; index: number; catKey: string }) {
  const cls = HIGHLIGHT_CATEGORIES.find((c) => c.key === catKey);
  const color = cls?.color ?? "#1E40AF";
  const bg = cls?.bg ?? "bg-primary-bg/40";
  const textColor = cls?.textColor ?? "text-primary";
  const label = pickLabel(catKey, index);

  return (
    <div className={`pl-4 py-3 pr-4 border-l-[3px] rounded-r-lg mb-4 ${bg}`} style={{ borderLeftColor: color }}>
      <div className={`text-[10px] font-semibold tracking-[1px] mb-1 ${textColor}`}>{label}</div>
      <p className="text-[15px] leading-relaxed text-[#3D3D3D]">{text}</p>
    </div>
  );
}

function SuggestionBlock({ suggestion }: { suggestion: SuggestionItem }) {
  const cfg = SEVERITY_CONFIG[suggestion.severity];
  const bgCls = suggestion.severity === "critical" ? "bg-error-bg/30" : suggestion.severity === "warning" ? "bg-warning-bg/20" : "bg-primary-bg/40";
  return (
    <div className={`pl-4 py-3 pr-4 border-l-[3px] rounded-r-lg mb-4 ${bgCls}`}
      style={{ borderLeftColor: suggestion.severity === "critical" ? "#DC2626" : suggestion.severity === "warning" ? "#D97706" : "#3B82F6" }}>
      <div className={`text-[10px] font-semibold uppercase tracking-[1px] mb-1 ${cfg.color}`}>
        {cfg.icon} {cfg.label}
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{suggestion.issue}</p>
      {suggestion.direction && (
        <p className="text-xs text-text-muted mt-1 italic">→ {suggestion.direction}</p>
      )}
    </div>
  );
}

function PullQuote({ text }: { text: string }) {
  return (
    <blockquote className="border-y-2 border-primary py-7 my-10 font-display italic text-[22px] leading-relaxed text-primary text-center">
      {text}
    </blockquote>
  );
}

function PacingStrip({ curve, cv, typeRatio }: {
  curve: { paragraph: number; tension: number; type: string }[];
  cv: number;
  typeRatio: { action: number; dialogue: number; description: number };
}) {
  if (curve.length === 0) return null;
  return (
    <section className="mb-12">
      <div className="bg-surface rounded-[2px] py-9 px-9 shadow-[0_1px_0_#E5E5E0,0_-1px_0_#E5E5E0]">
        <div className="flex items-center justify-between mb-5">
          <span className="font-display italic text-xl text-text">段落张力走势</span>
          <div className="flex gap-6 text-[11px] text-text-muted">
            <span><span className="text-[#DC2626] mr-1">━</span>动作</span>
            <span><span className="text-[#3B82F6] mr-1">━</span>对话</span>
            <span><span className="text-[#059669] mr-1">━</span>描写</span>
          </div>
        </div>
        <PacingCurve data={curve.map((p) => ({ paragraph: p.paragraph, tension: p.tension, type: p.type as "action" | "dialogue" | "description" }))} />
        <div className="flex gap-8 mt-5 justify-center">
          <div className="text-center"><span className="font-mono text-xl">{cv.toFixed(2)}</span><br /><span className="text-[10px] text-text-muted">CV 变异系数</span></div>
          <div className="text-center"><span className="font-mono text-xl">{(typeRatio.action * 100).toFixed(0)}%</span><br /><span className="text-[10px] text-text-muted">动作占比</span></div>
          <div className="text-center"><span className="font-mono text-xl">{(typeRatio.dialogue * 100).toFixed(0)}%</span><br /><span className="text-[10px] text-text-muted">对话占比</span></div>
          <div className="text-center"><span className="font-mono text-xl">{(typeRatio.description * 100).toFixed(0)}%</span><br /><span className="text-[10px] text-text-muted">描写占比</span></div>
        </div>
      </div>
    </section>
  );
}

function NotesStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-border-light -mx-10 mb-14 py-12 px-10 border-t border-border">
      <div className="max-w-[920px] mx-auto">
        {children}
      </div>
    </div>
  );
}

function NoteItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 mb-2 text-[13px] text-text-secondary bg-white/60 rounded-md last:mb-0">
      <span className="w-[22px] h-[22px] rounded-full bg-white text-warning flex items-center justify-center text-[11px] font-bold shrink-0 mt-px border border-border">!</span>
      <div>
        <div className="text-[10px] font-semibold text-[#8B8B83] uppercase tracking-[0.5px] mb-[3px]">{label}</div>
        {children}
      </div>
    </div>
  );
}

function TokenFooter({ children }: { children: React.ReactNode }) {
  return (
    <footer className="border-t border-border pt-6 flex justify-between font-mono text-[10px] text-text-muted">
      {children}
    </footer>
  );
}

function StatusBanner({ type, children }: { type: "warning" | "error"; children: React.ReactNode }) {
  const cls = type === "warning"
    ? "bg-warning-bg border-warning/30 text-warning"
    : "bg-error-bg border-error/30 text-error";
  return (
    <div className={`flex items-center gap-2 px-4 py-3 border rounded-md text-sm mb-8 ${cls}`}>
      <span>⚠</span>
      <span>{children}</span>
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

// ── V2 Complete ──

function V2CompleteReport({ report }: { report: EvaluationResultV2 & { status: "complete" } }) {
  const { scores, features, tokenUsage, divergence, deepseek, doubao } = report;
  const hasDivergence = divergence && divergence.length > 0;
  const divergenceDimKeys = divergence?.map((d) => d.dimension) ?? [];

  const allHighlights = mergeHighlights(deepseek.highlights, doubao.highlights);
  const allSuggestions = mergeSuggestions(deepseek.suggestions, doubao.suggestions);
  const allConsistencyIssues = mergeConsistencyIssues(deepseek.consistencyIssues, doubao.consistencyIssues);

  // Classify highlights and track per-category label indices
  const hlClassified = allHighlights.map((h) => classifyHighlight(h));
  const catCounters: Record<string, number> = {};
  const hlLabels = hlClassified.map((c) => {
    catCounters[c.label] = (catCounters[c.label] ?? 0) + 1;
    return { ...c, index: catCounters[c.label] - 1 };
  });

  // Pick best highlight as headline
  const headline = allHighlights.length > 0 ? allHighlights[0] : "评估报告";
  const hasNotes = features.filler.items.length > 0 || features.filler.suspiciousPairs.length > 0 || allConsistencyIssues.length > 0;

  return (
    <Article>
      <Kicker />
      <Headline text={headline} />
      <Deck>
        双模型交叉验证显示，本章在关键维度上表现如下。
        {hasDivergence && " 部分维度评分存在差异，详见下方详细数据。"}
        {!hasDivergence && " 两模型打分高度一致，结论可靠度高。"}
      </Deck>
      <Meta reportId="report" consensusOk={!hasDivergence}>
        {hasDivergence && divergence!.map((d) => (
          <div key={d.dimension} className="mt-1">
            <DivergenceTooltip item={d} />
            <span className="font-mono text-xs text-text-muted ml-1">
              {divKeyToLabel(d.dimension)}: DeepSeek {d.deepseek} vs Doubao {d.doubao} (差值 {d.delta})
            </span>
          </div>
        ))}
      </Meta>

      {/* Hero Chart */}
      <HeroChart>
        <RadarChart
          size="hero"
          hook={scores.deepseek.hookScore} climax={scores.deepseek.climaxScore}
          cliffhanger={scores.deepseek.cliffhangerScore} pacing={scores.deepseek.pacingScore}
          modelName="DeepSeek"
          secondModel={{
            name: "Doubao",
            scores: { hook: scores.doubao.hookScore, climax: scores.doubao.climaxScore, cliffhanger: scores.doubao.cliffhangerScore, pacing: scores.doubao.pacingScore },
            color: "#7C3AED", strokeDasharray: "6,4",
          }}
          divergenceDims={divergenceDimKeys.length > 0 ? divergenceDimKeys : undefined}
        />
        <ScoreCallouts
          scores={{ hook: scores.deepseek.hookScore, climax: scores.deepseek.climaxScore, cliffhanger: scores.deepseek.cliffhangerScore, pacing: scores.deepseek.pacingScore }}
          divergenceDims={divergenceDimKeys.length > 0 ? divergenceDimKeys : undefined}
        />
      </HeroChart>

      {/* Section 01: Highlights */}
      {allHighlights.length > 0 && (
        <>
          <SectionNum n="01" />
          <SectionTitle>做得好的地方</SectionTitle>
          <Cols>
            <MainCol>
              {allHighlights.map((h, i) => <HighlightParagraph key={i} text={h} index={hlLabels[i].index} catKey={hlLabels[i].label} />)}
            </MainCol>
            <SideCol title="编辑笔记">
              {allHighlights.length > 0 && (
                <p className="font-display italic text-[17px] leading-relaxed text-text-secondary">
                  "{allHighlights[0]?.slice(0, 40)}..." —— 这一句是你本章的核心记忆点。
                </p>
              )}
              <div className="w-10 h-px bg-border my-3" />
              <p className="text-xs text-text-muted mt-5">
                以上分析由 DeepSeek-v4 和 Doubao-seed 交叉验证。两模型对 Hook（{scores.deepseek.hookScore}/{scores.doubao.hookScore}）
                和爽点密度（{scores.deepseek.climaxScore}/{scores.doubao.climaxScore}）的判断{Math.abs(scores.deepseek.hookScore - scores.doubao.hookScore) <= 1 ? "高度一致" : "存在差异"}。
              </p>
            </SideCol>
          </Cols>
        </>
      )}

      {/* Pacing — full width between sections */}
      <PacingStrip curve={features.pacing.curve} cv={features.pacing.cv} typeRatio={features.pacing.typeRatio} />

      {/* Pull Quote */}
      {allHighlights.length >= 2 && (
        <PullQuote text={`${allHighlights[1]?.slice(0, 40)}——${allSuggestions.length > 0 ? `但${allSuggestions[0]?.issue.slice(0, 30)}` : "整体表现稳健"}。`} />
      )}

      {/* Section 02: Suggestions */}
      {allSuggestions.length > 0 && (
        <>
          <SectionNum n="02" />
          <SectionTitle>可以更强的地方</SectionTitle>
          <Cols>
            <MainCol>
              {allSuggestions.map((s, i) => (
                <SuggestionBlock key={i} suggestion={{ severity: s.severity, location: s.location, issue: s.issue, direction: s.direction }} />
              ))}
            </MainCol>
            <SideCol title="编辑笔记">
              <p className="font-display italic text-[17px] leading-relaxed text-text-secondary">
                {allSuggestions.length > 0
                  ? `"${allSuggestions[0]?.issue.slice(0, 30)}..." —— ${allSuggestions[0]?.severity === "critical" ? "这是本章最需要优先处理的问题。" : "这条建议值得关注，但不一定要全盘采纳。"}`
                  : ""}
              </p>
              <div className="w-10 h-px bg-border my-3" />
              <p className="text-xs text-text-muted mt-5">
                对话密度 {features.pacing.typeRatio.dialogue * 100}% 在网文中偏高，但需结合场景判断——对话承载核心情感时并非"水字数"。节奏曲线和 CV 数据见上方全宽图表。
              </p>
            </SideCol>
          </Cols>
        </>
      )}

      {/* Section 03: Notes strip */}
      {hasNotes && (
        <NotesStrip>
          <SectionNum n="03" />
          <SectionTitle>细节提示</SectionTitle>
          {features.filler.items.map((item, i) => (
            <NoteItem key={`fl-${i}`} label="注水检测">
              <p>第 {item.paragraph} 段：{item.reason}{item.suggestion && ` → ${item.suggestion}`}</p>
            </NoteItem>
          ))}
          {features.filler.suspiciousPairs.map((pair, i) => (
            <NoteItem key={`sp-${i}`} label="相似段落">
              <p className="font-mono text-xs">第{pair.paragraphA}段 ↔ 第{pair.paragraphB}段 (相似度: {Math.round(pair.similarity * 100)}%)</p>
            </NoteItem>
          ))}
          {allConsistencyIssues.map((issue, i) => (
            <NoteItem key={`cs-${i}`} label="一致性">
              <p>{issue}</p>
            </NoteItem>
          ))}
        </NotesStrip>
      )}

      <TokenFooter>
        <span>DeepSeek-v4-flash — 输入 {formatNumber(tokenUsage.deepseek.promptTokens)} · 输出 {formatNumber(tokenUsage.deepseek.completionTokens)} tokens</span>
        <span>Doubao-seed-2.0 — 输入 {formatNumber(tokenUsage.doubao.promptTokens)} · 输出 {formatNumber(tokenUsage.doubao.completionTokens)} tokens</span>
      </TokenFooter>
    </Article>
  );
}

// ── V2 Partial ──

function V2PartialReport({ report }: { report: EvaluationResultV2 & { status: "partial" } }) {
  const { scores, features, failedModelLabel, tokenUsage } = report;
  const hasNotes = features.filler.items.length > 0 || features.filler.suspiciousPairs.length > 0;

  return (
    <Article>
      <StatusBanner type="warning">
        部分 AI 模型暂不可用（{failedModelLabel} 评估超时），当前显示可用模型的评估结果
      </StatusBanner>
      <Kicker />
      <Headline text="评估报告" />
      <Deck>部分结果 · {failedModelLabel} 不可用。以下数据基于可用模型的评估。</Deck>
      <Meta reportId="部分结果" />

      <HeroChart>
        <RadarChart size="hero" hook={scores.hookScore} climax={scores.climaxScore} cliffhanger={scores.cliffhangerScore} pacing={scores.pacingScore} />
        <ScoreCallouts scores={{ hook: scores.hookScore, climax: scores.climaxScore, cliffhanger: scores.cliffhangerScore, pacing: scores.pacingScore }} />
      </HeroChart>
      <p className="text-center text-[11px] text-warning -mt-8 mb-12">⚠ {failedModelLabel} 评估超时，仅显示单一模型结果</p>

      <PacingStrip curve={features.pacing.curve} cv={features.pacing.cv} typeRatio={features.pacing.typeRatio} />

      {hasNotes && (
        <NotesStrip>
          <SectionNum n="01" />
          <SectionTitle>细节提示</SectionTitle>
          {features.filler.items.map((item, i) => (
            <NoteItem key={`fl-${i}`} label="注水检测">
              <p>第 {item.paragraph} 段：{item.reason}{item.suggestion && ` → ${item.suggestion}`}</p>
            </NoteItem>
          ))}
          {features.filler.suspiciousPairs.map((pair, i) => (
            <NoteItem key={`sp-${i}`} label="相似段落">
              <p className="font-mono text-xs">第{pair.paragraphA}段 ↔ 第{pair.paragraphB}段 (相似度: {Math.round(pair.similarity * 100)}%)</p>
            </NoteItem>
          ))}
        </NotesStrip>
      )}

      {tokenUsage && (
        <TokenFooter>
          <span>Token 用量：输入 {formatNumber(tokenUsage.promptTokens)} · 输出 {formatNumber(tokenUsage.completionTokens)}</span>
        </TokenFooter>
      )}
    </Article>
  );
}

// ── V2 Degraded ──

function V2DegradedReport({ report, onRetry }: { report: EvaluationResultV2 & { status: "degraded" }; onRetry?: () => void }) {
  const { features } = report;
  const hasNotes = features.filler.items.length > 0 || features.filler.suspiciousPairs.length > 0;

  return (
    <Article>
      <StatusBanner type="error">
        AI 服务暂不可用，以下为基于规则引擎的分析结果
      </StatusBanner>
      <Kicker />
      <Headline text="评估报告" />
      <Deck>降级评估 · 规则引擎分析。AI 模型暂不可用，以下为规则引擎生成的参考数据。</Deck>
      <Meta reportId="降级评估" />

      <section className="bg-surface rounded-[2px] py-9 px-9 shadow-[0_1px_0_#E5E5E0,0_-1px_0_#E5E5E0] mb-12">
        <h3 className="font-display italic text-[17px] text-text mb-4">规则引擎分析</h3>
        <div className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">{report.report}</div>
      </section>

      <PacingStrip curve={features.pacing.curve} cv={features.pacing.cv} typeRatio={features.pacing.typeRatio} />

      {hasNotes && (
        <NotesStrip>
          <SectionNum n="01" />
          <SectionTitle>细节提示</SectionTitle>
          {features.filler.items.map((item, i) => (
            <NoteItem key={`fl-${i}`} label="注水检测">
              <p>第 {item.paragraph} 段：{item.reason}{item.suggestion && ` → ${item.suggestion}`}</p>
            </NoteItem>
          ))}
          {features.filler.suspiciousPairs.map((pair, i) => (
            <NoteItem key={`sp-${i}`} label="相似段落">
              <p className="font-mono text-xs">第{pair.paragraphA}段 ↔ 第{pair.paragraphB}段 (相似度: {Math.round(pair.similarity * 100)}%)</p>
            </NoteItem>
          ))}
        </NotesStrip>
      )}

      <div className="text-center">
        <button onClick={onRetry} className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-light transition-colors">
          重新评估
        </button>
      </div>
    </Article>
  );
}

// ── Old format ──

function OldReport({ report }: { report: EvaluationReport }) {
  const { scores, llmResult, isPartial } = report;
  const hasLLM = llmResult !== null;
  const hasRuleFallback = report.hookSource === "rule" || report.cliffhangerSource === "rule";
  const sortedSuggestions = llmResult ? sortSuggestions(normalizeSuggestions(llmResult.suggestions)) : [];
  const hasNotes = report.fillerResult.items.length > 0 || report.fillerResult.suspiciousPairs.length > 0 || (hasLLM && llmResult.consistencyIssues.length > 0);

  // Classify highlights for label rotation
  const hlClassifiedOld = hasLLM ? llmResult.highlights.map((h) => classifyHighlight(h)) : [];
  const catCountersOld: Record<string, number> = {};
  const hlLabelsOld = hlClassifiedOld.map((c) => {
    catCountersOld[c.label] = (catCountersOld[c.label] ?? 0) + 1;
    return { ...c, index: catCountersOld[c.label] - 1 };
  });

  return (
    <Article>
      {isPartial && (
        <StatusBanner type="warning">
          部分评估结果 — LLM 评估未完成，以下数据基于规则引擎分析，仅供参考
        </StatusBanner>
      )}
      <Kicker />
      <Headline text={llmResult?.highlights?.[0] ?? "评估报告"} />
      <Deck>
        {llmResult ? "AI 深度分析完成。以下为详细评估结果。" : "LLM 评估未完成，以下为规则引擎参考数据。"}
        {isPartial && " 部分维度使用规则引擎参考分。"}
      </Deck>
      <Meta reportId={report.reportId} />

      <HeroChart>
        <RadarChart size="hero" hook={scores.hookScore} climax={scores.climaxScore} cliffhanger={scores.cliffhangerScore} pacing={scores.pacingScore} />
        <ScoreCallouts scores={{ hook: scores.hookScore, climax: scores.climaxScore, cliffhanger: scores.cliffhangerScore, pacing: scores.pacingScore }} />
      </HeroChart>
      {hasRuleFallback && (
        <p className="text-center text-[11px] text-warning -mt-8 mb-12">⚠ 部分维度使用规则引擎参考分（AI 深度分析未完成）</p>
      )}

      {hasLLM && llmResult.highlights.length > 0 && (
        <>
          <SectionNum n="01" />
          <SectionTitle>做得好的地方</SectionTitle>
          <Cols>
            <MainCol>
              {llmResult.highlights.map((h, i) => <HighlightParagraph key={i} text={h} index={hlLabelsOld[i].index} catKey={hlLabelsOld[i].label} />)}
            </MainCol>
            <SideCol title="编辑笔记">
              <p className="font-display italic text-[17px] leading-relaxed text-text-secondary">
                "{llmResult.highlights[0]?.slice(0, 40)}..." —— 这一句是你本章的核心记忆点。
              </p>
            </SideCol>
          </Cols>
        </>
      )}

      <PacingStrip curve={report.pacingResult.curve} cv={report.pacingResult.cv} typeRatio={report.pacingResult.typeRatio} />

      {hasLLM && llmResult.highlights.length >= 2 && (
        <PullQuote text={`${llmResult.highlights[1]?.slice(0, 40)}——整体表现值得关注。`} />
      )}

      {hasLLM && sortedSuggestions.length > 0 && (
        <>
          <SectionNum n="02" />
          <SectionTitle>可以更强的地方</SectionTitle>
          <Cols>
            <MainCol>
              {sortedSuggestions.map((s, i) => <SuggestionBlock key={i} suggestion={s} />)}
            </MainCol>
            <SideCol title="编辑笔记">
              <p className="font-display italic text-[17px] leading-relaxed text-text-secondary">
                {sortedSuggestions[0]?.severity === "critical"
                  ? "关键问题需要优先处理。"
                  : "以上建议按优先级排列，逐一检查即可。"}
              </p>
            </SideCol>
          </Cols>
        </>
      )}

      {hasNotes && (
        <NotesStrip>
          <SectionNum n="03" />
          <SectionTitle>细节提示</SectionTitle>
          {report.fillerResult.items.map((item, i) => (
            <NoteItem key={`fl-${i}`} label="注水检测">
              <p>第 {item.paragraph} 段：{item.reason}{item.suggestion && ` → ${item.suggestion}`}</p>
            </NoteItem>
          ))}
          {report.fillerResult.suspiciousPairs.map((pair, i) => (
            <NoteItem key={`sp-${i}`} label="相似段落">
              <p className="font-mono text-xs">第{pair.paragraphA}段 ↔ 第{pair.paragraphB}段 (相似度: {Math.round(pair.similarity * 100)}%)</p>
            </NoteItem>
          ))}
          {hasLLM && llmResult.consistencyIssues.map((issue, i) => (
            <NoteItem key={`cs-${i}`} label="一致性">
              <p>{issue}</p>
            </NoteItem>
          ))}
        </NotesStrip>
      )}

      {report.tokenUsage && (
        <TokenFooter>
          <span>Token 用量：输入 {formatNumber(report.tokenUsage.promptTokens)} · 输出 {formatNumber(report.tokenUsage.completionTokens)}</span>
          {report.costEstimate != null && <span>预估成本：¥{report.costEstimate.toFixed(4)}</span>}
        </TokenFooter>
      )}
    </Article>
  );
}

// ── Main ReportCard ──

export function ReportCard({ report, onRetry }: { report: ReportData; onRetry?: () => void }) {
  if (isV2(report)) {
    switch (report.status) {
      case "complete": return <V2CompleteReport report={report} />;
      case "partial": return <V2PartialReport report={report} />;
      case "degraded": return <V2DegradedReport report={report} onRetry={onRetry} />;
    }
  }
  return <OldReport report={report} />;
}

export function EmptyReport() {
  return (
    <div className="max-w-lg mx-auto p-8">
      <div className="text-center p-12 bg-surface rounded-lg border border-border">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="font-display text-xl text-text mb-2">开始评估</h3>
        <p className="text-sm text-text-muted">输入章节文本并点击「开始评估」，获取 AI 写作质量分析报告</p>
      </div>
    </div>
  );
}

export function ErrorReport({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-lg mx-auto p-8">
      <div className="p-6 bg-error-bg border border-error rounded-lg text-center">
        <div className="text-3xl mb-3">⚠</div>
        <p className="text-error font-medium">评估失败</p>
        <p className="mt-1 text-sm text-text-secondary">{message}</p>
        <button onClick={onRetry} className="mt-4 px-6 py-2 bg-error text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity">重试</button>
      </div>
    </div>
  );
}
