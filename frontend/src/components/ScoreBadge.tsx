interface ScoreBadgeProps {
  score: number;
  label?: string;
  source?: "llm" | "rule";
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-score-high";
  if (score >= 5) return "text-score-mid";
  return "text-score-low";
}

export function ScoreBadge({ score, label, source }: ScoreBadgeProps) {
  const display = Number.isInteger(score) ? score.toString() : score.toFixed(1);
  const colorClass = scoreColor(score);
  const isRuleFallback = source === "rule";

  return (
    <div className="flex flex-col items-center">
      <span className={`font-mono text-3xl font-bold tabular-nums ${colorClass}`}>
        {display}
      </span>
      {label && (
        <span className="mt-1 text-xs text-text-muted">{label}</span>
      )}
      {isRuleFallback && (
        <span
          className="mt-0.5 text-[10px] text-warning bg-warning-bg px-1.5 py-0.5 rounded"
          title="AI 深度分析未完成，当前为规则引擎参考分"
        >
          参考分
        </span>
      )}
    </div>
  );
}
