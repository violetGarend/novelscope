import { useHistoryStore } from "@/stores/history-store";
import type { ReportData } from "./ReportCard";

const STORAGE_KEY = "novelscope_history";
const MAX_ENTRIES = 10;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  reportId: string;
  textSummary: string;
  fullReport?: ReportData;
}

function loadFromStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    // handle Zustand persist format if present
    if (parsed?.state?.entries) return parsed.state.entries;
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: HistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function deduplicate(entries: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const result = entries.filter((e) => e.reportId !== entry.reportId);
  result.unshift(entry);
  if (result.length > MAX_ENTRIES) result.length = MAX_ENTRIES;
  return result;
}

/** @deprecated Migrate to useHistoryStore directly via @/stores */
export function saveEvaluation(entry: HistoryEntry): void {
  // Manage localStorage in legacy format first, so that loadHistory()
  // sees the correct data regardless of Zustand's persist format.
  // This is critical for backward compatibility: tests clear mocked
  // localStorage between runs and expect loadHistory() to reflect only
  // the current test's writes.
  const current = loadFromStorage();
  saveToStorage(deduplicate(current, entry));

  // Sync to Zustand store for new consumers that use useHistoryStore directly
  useHistoryStore.getState().addEntry(entry);
}

/** @deprecated Migrate to useHistoryStore(selectEntries) directly via @/stores */
export function loadHistory(): HistoryEntry[] {
  return loadFromStorage();
}

/** @deprecated Migrate to useHistoryStore directly via @/stores */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
  useHistoryStore.getState().clearHistory();
}
