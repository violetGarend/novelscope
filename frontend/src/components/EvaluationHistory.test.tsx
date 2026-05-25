import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { saveEvaluation, loadHistory, clearHistory, type HistoryEntry } from "./historyStore";
import { EvaluationHistory } from "./EvaluationHistory";

// Noon UTC on 2023-11-15 — works in all timezones
const SAMPLE_ENTRY: HistoryEntry = {
  id: "entry_1",
  timestamp: 1700049600000,
  reportId: "report_test_001",
  textSummary: "他一拳打出，直接碾压对手。众人目瞪口呆，不敢相信眼前的一幕。",
};

// Mock localStorage
const storage = new Map<string, string>();
beforeEach(() => {
  storage.clear();
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => storage.get(String(key)) ?? null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => storage.set(String(key), String(value)));
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => { storage.delete(String(key)); });
});

describe("evaluationHistory (localStorage)", () => {
  it("should save and load an entry", () => {
    saveEvaluation(SAMPLE_ENTRY);
    const entries = loadHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("entry_1");
    expect(entries[0].textSummary).toBe(SAMPLE_ENTRY.textSummary);
  });

  it("should trim to max 10 entries (FIFO)", () => {
    for (let i = 1; i <= 12; i++) {
      saveEvaluation({
        ...SAMPLE_ENTRY,
        id: `entry_${i}`,
        reportId: `report_test_${String(i).padStart(3, "0")}`,
        timestamp: 1700000000000 + i,
      });
    }
    const entries = loadHistory();
    expect(entries).toHaveLength(10);
    // Most recent first; oldest entries (1, 2) removed
    expect(entries[0].id).toBe("entry_12");
    expect(entries[9].id).toBe("entry_3");
  });

  it("should store most recent entries first", () => {
    saveEvaluation({ ...SAMPLE_ENTRY, id: "old", reportId: "report_old", timestamp: 1000 });
    saveEvaluation({ ...SAMPLE_ENTRY, id: "new", reportId: "report_new", timestamp: 2000 });
    const entries = loadHistory();
    expect(entries[0].id).toBe("new");
    expect(entries[1].id).toBe("old");
  });

  it("should deduplicate by reportId (replace existing)", () => {
    saveEvaluation({ ...SAMPLE_ENTRY, id: "first", reportId: "dup" });
    saveEvaluation({ ...SAMPLE_ENTRY, id: "second", reportId: "dup" });
    const entries = loadHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("second");
  });

  it("should persist and retrieve fullReport", () => {
    const full = { reportId: "rpt", scores: { hookScore: 8, climaxScore: 7, cliffhangerScore: 9, pacingScore: 6 }, isPartial: false } as unknown as HistoryEntry["fullReport"];
    saveEvaluation({ ...SAMPLE_ENTRY, fullReport: full as HistoryEntry["fullReport"] });
    const entries = loadHistory();
    expect(entries[0].fullReport).toBeDefined();
  });

  it("should clear history", () => {
    saveEvaluation(SAMPLE_ENTRY);
    clearHistory();
    expect(loadHistory()).toHaveLength(0);
  });
});

describe("EvaluationHistory component", () => {
  beforeEach(() => {
    clearHistory();
  });

  it("should show empty message when no history", () => {
    render(<EvaluationHistory />);
    expect(screen.getByText(/暂无评估历史/i)).toBeInTheDocument();
  });

  it("should display saved entries with text summary and time", () => {
    saveEvaluation(SAMPLE_ENTRY);
    render(<EvaluationHistory />);
    expect(screen.getByText(/一拳打出.*碾压对手/)).toBeInTheDocument();
    expect(screen.getByText(/2023-11-15/)).toBeInTheDocument();
  });

  it("should call onSelect with entry when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    saveEvaluation(SAMPLE_ENTRY);
    render(<EvaluationHistory onSelect={onSelect} />);

    const entry = screen.getByText(/一拳打出.*碾压对手/).closest("button");
    expect(entry).toBeInTheDocument();
    await user.click(entry!);
    expect(onSelect).toHaveBeenCalledWith(SAMPLE_ENTRY);
  });
});
