export interface StepDef {
  step: number;
  stepName: string;
}

export const EVALUATION_STEPS: StepDef[] = [
  { step: 1, stepName: "正在验证文本" },
  { step: 2, stepName: "分析爽点密度" },
  { step: 3, stepName: "分析节奏" },
  { step: 4, stepName: "构建 AI 提示…" },
  { step: 5, stepName: "调用 AI 分析…" },
  { step: 6, stepName: "处理 AI 结果…" },
  { step: 7, stepName: "生成报告" },
];

interface ProgressBarProps {
  currentStep: number;
}

function StepIcon({ state, step }: { state: "completed" | "active" | "pending"; step: number }) {
  if (state === "completed") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white text-xs font-bold">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-mono animate-pulse">
        {step}
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-text-muted text-xs font-mono">
      {step}
    </span>
  );
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <ol className="space-y-2">
      {EVALUATION_STEPS.map((s) => {
        const state: "completed" | "active" | "pending" =
          currentStep > 7 || currentStep > s.step
            ? "completed"
            : currentStep === s.step
              ? "active"
              : "pending";

        return (
          <li
            key={s.step}
            role="listitem"
            data-state={state}
            className="flex items-center gap-3 transition-colors duration-300"
          >
            <StepIcon state={state} step={s.step} />
            <span
              className={
                state === "completed"
                  ? "text-text-secondary text-sm"
                  : state === "active"
                    ? "text-primary font-medium text-sm"
                    : "text-text-muted text-sm"
              }
            >
              {s.stepName}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
