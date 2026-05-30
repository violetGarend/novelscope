export {
  useHistoryStore,
  selectEntries,
  selectAddEntry,
  selectClearHistory,
} from "./history-store";
export type { HistoryEntry } from "./history-store";

export {
  useEvaluationStore,
  selectText,
  selectPhase,
  selectCurrentStep,
  selectCurrentStepName,
  selectResult,
  selectErrorMessage,
  selectSetText,
  selectSubmitEvaluation,
  selectResetToIdle,
} from "./evaluation-store";

export { useAuthStore } from "./auth-store";
