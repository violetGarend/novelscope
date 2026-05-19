interface ScoreBadgeProps {
  score: number;
  label?: string;
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-score-high";
  if (score >= 5) return "text-score-mid";
  return "text-score-low";
}

export function ScoreBadge({ score, label }: ScoreBadgeProps) {
  const display = Number.isInteger(score) ? score.toString() : score.toFixed(1);
  const colorClass = scoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <span className={`font-mono text-3xl font-bold tabular-nums ${colorClass}`}>
        {display}
      </span>
      {label && (
        <span className="mt-1 text-xs text-text-muted">{label}</span>
      )}
    </div>
  );
}
