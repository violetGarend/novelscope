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

export function EvaluationHistory({
  onSelect,
}: {
  onSelect?: (entry: HistoryEntry) => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 客户端挂载后从 localStorage 加载历史记录，仅执行一次
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
          className="w-full text-left px-4 py-3 bg-surface border border-border rounded-md hover:bg-surface-hover transition-colors duration-200"
        >
          <p className="text-sm text-text truncate">
            {truncate(entry.textSummary, 50)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {formatTime(entry.timestamp)}
          </p>
        </button>
      ))}
    </div>
  );
}
