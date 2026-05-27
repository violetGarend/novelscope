"use client";

import { useCallback } from "react";
import { ProgressBar } from "./ProgressBar";
import { ReportCard, ErrorReport } from "./ReportCard";
import { EvaluationHistory } from "./EvaluationHistory";
import {
  useEvaluationStore,
  selectText,
  selectPhase,
  selectCurrentStep,
  selectCurrentStepName,
  selectResult,
  selectErrorMessage,
  selectSetText,
  selectResetToIdle,
  selectSubmitEvaluation,
} from "@/stores/evaluation-store";

export function EvaluatePage() {
  const text = useEvaluationStore(selectText);
  const phase = useEvaluationStore(selectPhase);
  const currentStep = useEvaluationStore(selectCurrentStep);
  const currentStepName = useEvaluationStore(selectCurrentStepName);
  const result = useEvaluationStore(selectResult);
  const errorMessage = useEvaluationStore(selectErrorMessage);
  const setText = useEvaluationStore(selectSetText);
  const handleRetry = useEvaluationStore(selectResetToIdle);
  const submitEvaluation = useEvaluationStore(selectSubmitEvaluation);

  const handleSubmit = useCallback(() => {
    submitEvaluation();
  }, [submitEvaluation]);

  if (phase === "evaluating") {
    return (
      <div className="max-w-lg mx-auto p-8">
        <h2 className="font-display text-2xl text-text mb-6">正在评估...</h2>
        {currentStep === 0 ? (
          <div data-testid="skeleton" className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-border" />
                <div className="h-4 w-32 rounded bg-border" />
              </div>
            ))}
          </div>
        ) : (
          <ProgressBar currentStep={currentStep} currentStepName={currentStepName} />
        )}
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <>
        <ReportCard
          report={result}
          onRetry={() => {
            handleRetry();
          }}
        />
        <div className="text-center pb-12">
          <button
            onClick={() => { handleRetry(); }}
            className="px-6 py-2 text-sm text-primary hover:text-primary-light transition-colors"
          >
            ← 重新评估
          </button>
        </div>
      </>
    );
  }

  if (phase === "error") {
    return <ErrorReport message={errorMessage} onRetry={handleRetry} />;
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <h2 className="font-display text-2xl text-text mb-6">章节评估</h2>
      <textarea
        placeholder="输入章节文本（至少1000字）..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        className="w-full p-4 bg-surface border border-border rounded-md text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-lighter focus:border-primary-light resize-y"
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-text-muted">{text.length} 字</span>
        <button
          onClick={handleSubmit}
          disabled={text.length < 1000}
          className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
          开始评估
        </button>
      </div>

      <div className="mt-10">
        <h3 className="font-display text-lg text-text mb-4">评估历史</h3>
        <EvaluationHistory
          onSelect={(entry) => {
            if (entry.fullReport) {
              useEvaluationStore.setState({ result: entry.fullReport, phase: "done" });
            }
          }}
        />
      </div>
    </div>
  );
}
