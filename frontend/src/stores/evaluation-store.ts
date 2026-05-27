import { create } from "zustand";
import type { ReportData } from "@/components/ReportCard";
import { useHistoryStore } from "./history-store";

type Phase = "idle" | "evaluating" | "done" | "error";

interface EvaluationState {
  text: string;
  phase: Phase;
  currentStep: number;
  currentStepName: string;
  result: ReportData | null;
  errorMessage: string;
  abortController: AbortController | null;

  setText: (text: string) => void;
  resetToIdle: () => void;
  cancelEvaluation: () => void;
  submitEvaluation: () => Promise<void>;
}

export const useEvaluationStore = create<EvaluationState>()((set, get) => ({
  text: "",
  phase: "idle",
  currentStep: 0,
  currentStepName: "",
  result: null,
  errorMessage: "",
  abortController: null,

  setText: (text) => set({ text }),

  resetToIdle: () =>
    set({
      phase: "idle",
      currentStep: 0,
      currentStepName: "",
      result: null,
      errorMessage: "",
      abortController: null,
    }),

  cancelEvaluation: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null });
    }
  },

  submitEvaluation: async () => {
    const { text } = get();
    if (text.length < 1000) return;

    set({
      phase: "evaluating",
      currentStep: 0,
      currentStepName: "",
      result: null,
      errorMessage: "",
    });

    const controller = new AbortController();
    set({ abortController: controller });

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/evaluate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterText: text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        set({ errorMessage: err.error?.message ?? "评估失败", phase: "error" });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        set({ errorMessage: "无法读取响应流", phase: "error" });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(trimmed.slice(6));
            if (event.type === "progress") {
              set({
                currentStep: event.step,
                ...(event.stepName
                  ? { currentStepName: event.stepName }
                  : {}),
              });
            } else if (event.type === "result") {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { type, ...reportData } = event;
              const report = reportData as ReportData;
              set({
                result: report,
                currentStep: 8,
                phase: "done",
              });

              // Build report ID for history
              const reportId =
                "status" in report
                  ? `report_${Date.now()}`
                  : (report as { reportId: string }).reportId ??
                    `report_${Date.now()}`;

              useHistoryStore.getState().addEntry({
                id: `eval_${Date.now()}`,
                timestamp: Date.now(),
                reportId,
                textSummary: text.slice(0, 100),
                fullReport: report,
              });
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      set({
        errorMessage: err instanceof Error ? err.message : "评估失败",
        phase: "error",
      });
    }
  },
}));

// Selector helpers for fine-grained subscriptions
export const selectText = (state: EvaluationState) => state.text;
export const selectPhase = (state: EvaluationState) => state.phase;
export const selectCurrentStep = (state: EvaluationState) => state.currentStep;
export const selectCurrentStepName = (state: EvaluationState) =>
  state.currentStepName;
export const selectResult = (state: EvaluationState) => state.result;
export const selectErrorMessage = (state: EvaluationState) => state.errorMessage;
export const selectSetText = (state: EvaluationState) => state.setText;
export const selectResetToIdle = (state: EvaluationState) => state.resetToIdle;
export const selectSubmitEvaluation = (state: EvaluationState) =>
  state.submitEvaluation;
