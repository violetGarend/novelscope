"use client";

import { useState, useEffect } from "react";
import { loadHistory, type HistoryEntry } from "./historyStore";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-score-high";
  if (score >= 5) return "text-score-mid";
  return "text-score-low";
}

export function EvaluationHistory({
  onSelect,
}: {
  onSelect?: (entry: HistoryEntry) => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-8">暂无评估历史</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onSelect?.(entry)}
          className="w-full text-left flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-md hover:bg-surface-hover transition-colors duration-200"
        >
          <span className={`shrink-0 font-mono text-lg font-bold tabular-nums ${scoreColor(entry.overallScore)}`}>
            {entry.overallScore.toFixed(1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-text truncate">
              {truncate(entry.textSummary, 50)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {formatTime(entry.timestamp)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
