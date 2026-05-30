import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { beforeEach, afterEach } from "vitest";
import { useEvaluationStore } from "./stores/evaluation-store";

// Reset Zustand session stores between tests to prevent cross-test leakage
beforeEach(() => {
  useEvaluationStore.setState({
    text: "",
    phase: "idle",
    currentStep: 0,
    currentStepName: "",
    result: null,
    errorMessage: "",
    abortController: null,
  });
});

afterEach(() => {
  cleanup();
});
