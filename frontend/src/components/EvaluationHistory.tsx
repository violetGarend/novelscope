"use client";

import { useHistoryStore, selectEntries } from "@/stores/history-store";
import type { HistoryEntry } from "./historyStore";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

export function EvaluationHistory({
  onSelect,
}: {
  onSelect?: (entry: HistoryEntry) => void;
}) {
  const entries = useHistoryStore(selectEntries);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 px-4 border border-dashed border-border-light rounded-lg">
        <p className="text-sm text-text-muted">暂无评估历史</p>
        <p className="text-xs text-text-muted/60 mt-1">完成评估后，报告将自动保存在此处</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onSelect?.(entry)}
          className="w-full text-left px-4 py-3 bg-surface border border-border rounded-md hover:bg-surface-hover hover:border-border-light transition-all duration-200 group"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/20 shrink-0 group-hover:bg-primary transition-colors duration-200" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text truncate">
                {truncate(entry.textSummary, 50)}
              </p>
              <p className="text-xs text-text-muted font-mono mt-1 tabular-nums">
                {formatTime(entry.timestamp)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
