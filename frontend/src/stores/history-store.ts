import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ReportData } from "@/components/ReportCard";

const STORAGE_KEY = "novelscope_history_store";
const MAX_ENTRIES = 10;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  reportId: string;
  textSummary: string;
  fullReport?: ReportData;
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => {
          const idx = state.entries.findIndex(
            (e) => e.reportId === entry.reportId
          );
          const entries = [...state.entries];
          if (idx !== -1) entries.splice(idx, 1);
          entries.unshift(entry);
          if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
          return { entries };
        }),
      clearHistory: () => set({ entries: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Selector helpers for fine-grained subscriptions
export const selectEntries = (state: HistoryState) => state.entries;
export const selectAddEntry = (state: HistoryState) => state.addEntry;
export const selectClearHistory = (state: HistoryState) => state.clearHistory;
