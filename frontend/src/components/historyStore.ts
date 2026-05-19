import type { EvaluationReport } from "./ReportCard";

const STORAGE_KEY = "novelscope_history";
const MAX_ENTRIES = 10;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  reportId: string;
  overallScore: number;
  textSummary: string;
  fullReport?: EvaluationReport;
}

export function saveEvaluation(entry: HistoryEntry): void {
  const entries = loadHistory();
  // Replace existing entry with same reportId
  const idx = entries.findIndex((e) => e.reportId === entry.reportId);
  if (idx !== -1) {
    entries.splice(idx, 1);
  }
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
