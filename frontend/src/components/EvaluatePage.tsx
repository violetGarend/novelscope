"use client";

import { useState, useRef, useCallback } from "react";
import { ProgressBar } from "./ProgressBar";
import { ReportCard, ErrorReport, type EvaluationReport } from "./ReportCard";
import { EvaluationHistory } from "./EvaluationHistory";
import { saveEvaluation } from "./historyStore";

type Phase = "idle" | "evaluating" | "done" | "error";

export function EvaluatePage() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<EvaluationReport | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleRetry = useCallback(() => {
    setPhase("idle");
    setErrorMessage("");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (text.length < 1000) return;

    setPhase("evaluating");
    setCurrentStep(0);
    setResult(null);
    setErrorMessage("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/evaluate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterText: text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        setErrorMessage(err.error?.message ?? "评估失败");
        setPhase("error");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setErrorMessage("无法读取响应流");
        setPhase("error");
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
              setCurrentStep(event.step);
            } else if (event.type === "result") {
              const report = event as EvaluationReport;
              setResult(report);
              setCurrentStep(8);
              setPhase("done");
              saveEvaluation({
                id: `eval_${Date.now()}`,
                timestamp: Date.now(),
                reportId: report.reportId,
                overallScore: report.scores.overallScore,
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
      setErrorMessage(err instanceof Error ? err.message : "评估失败");
      setPhase("error");
    }
  }, [text]);

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
          <ProgressBar currentStep={currentStep} />
        )}
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <>
        <ReportCard report={result} />
        <div className="text-center pb-12">
          <button
            onClick={() => { setPhase("idle"); setCurrentStep(0); setResult(null); }}
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
              setResult(entry.fullReport);
              setPhase("done");
            }
          }}
        />
      </div>
    </div>
  );
}
