"use client";

import { useState, useRef, useCallback } from "react";
import { ProgressBar } from "./ProgressBar";

interface EvaluationResult {
  reportId: string;
  scores: { overallScore: number };
  isPartial: boolean;
}

type Phase = "idle" | "evaluating" | "done" | "error";

export function EvaluatePage() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async () => {
    if (text.length < 100) return;

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
              setResult(event);
              setCurrentStep(8); // all steps completed
              setPhase("done");
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
      <div className="max-w-lg mx-auto p-8">
        <h2 className="font-display text-2xl text-text mb-6">评估完成</h2>
        <ProgressBar currentStep={8} />
        <div className="mt-8 p-6 bg-surface rounded-lg border border-border">
          <p className="text-sm text-text-secondary">报告 ID: {result.reportId}</p>
          <p className="mt-2 font-mono text-3xl text-primary">
            {result.scores.overallScore}/10
          </p>
          {result.isPartial && (
            <p className="mt-2 text-sm text-warning">部分评估结果（LLM 未启用）</p>
          )}
        </div>
        <button
          onClick={() => { setPhase("idle"); setCurrentStep(0); setResult(null); }}
          className="mt-4 px-4 py-2 text-sm text-primary hover:text-primary-light transition-colors"
        >
          ← 重新评估
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="max-w-lg mx-auto p-8">
        <div className="p-6 bg-error-bg border border-error rounded-lg">
          <p className="text-error font-medium">评估失败</p>
          <p className="mt-1 text-sm text-text-secondary">{errorMessage}</p>
        </div>
        <button
          onClick={() => setPhase("idle")}
          className="mt-4 px-4 py-2 text-sm text-primary hover:text-primary-light transition-colors"
        >
          ← 返回重试
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <h2 className="font-display text-2xl text-text mb-6">章节评估</h2>
      <textarea
        placeholder="输入章节文本（至少100字）..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        className="w-full p-4 bg-surface border border-border rounded-md text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-lighter focus:border-primary-light resize-y"
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-text-muted">{text.length} 字</span>
        <button
          onClick={handleSubmit}
          disabled={text.length < 100}
          className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
          开始评估
        </button>
      </div>
    </div>
  );
}
