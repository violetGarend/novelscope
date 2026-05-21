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

/** Virtual warm-up steps shown before the real evaluation begins */
export const PRE_STEPS: StepDef[] = [
  { step: -2, stepName: "初始化评估引擎" },
  { step: -1, stepName: "加载分析模型" },
];

/** Virtual wrap-up steps shown after the real evaluation completes */
export const POST_STEPS: StepDef[] = [
  { step: 8, stepName: "整理评估数据" },
  { step: 9, stepName: "输出最终报告" },
];

interface ProgressBarProps {
  currentStep: number;
}

function StepIcon({ state, step }: { state: "completed" | "active" | "pending"; step: number }) {
  const isPreStep = step < 0;

  if (state === "completed") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white text-xs font-bold step-icon-completed">
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
    const isFinal = step === 7;
    if (isPreStep) {
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-mono step-icon-active">
          <span className="step-dot-pulse" />
          <span className="step-shimmer" />
        </span>
      );
    }
    return (
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-mono ${
          isFinal ? "bg-amber-500 step-icon-final" : "bg-primary step-icon-active"
        }`}
      >
        {step}
        <span className={isFinal ? "step-shimmer-final" : "step-shimmer"} />
      </span>
    );
  }
  // pending
  if (isPreStep) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border text-text-muted text-xs font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted/40" />
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
  const progressPct = Math.min(100, Math.round((currentStep / 7) * 100));

  /** Unified step list: pre-steps → real steps → post-steps (conditional) */
  const visibleSteps = [
    ...PRE_STEPS,
    ...EVALUATION_STEPS,
    ...(currentStep >= 7 ? POST_STEPS : []),
  ];

  function computeState(step: number): "completed" | "active" | "pending" {
    if (step < 0) {
      // Pre-steps: completed once evaluation has started
      if (currentStep >= 1) return "completed";
      if (currentStep === 0 && step === -1) return "active";
      return "pending";
    }
    if (step <= 7) {
      // Real steps (1-7): existing logic
      if (currentStep > 7 || currentStep > step) return "completed";
      if (currentStep === step) return "active";
      return "pending";
    }
    // Post-steps (8+): appear after real evaluation
    if (currentStep > 7) return "completed";
    if (currentStep === 7 && step === 8) return "active";
    return "pending";
  }

  return (
    <div>
      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span className={currentStep > 7 ? "text-success font-medium" : ""}>
            {currentStep === 0 ? "准备中…" : currentStep > 7 ? "评估完成" : `步骤 ${currentStep} / 7`}
          </span>
          <span className="font-mono tabular-nums">{progressPct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
          <div
            className={`h-full rounded-full progress-bar-fill${currentStep > 7 ? " relative progress-bar-complete" : ""}`}
            style={{
              width: `${currentStep === 0 ? 0 : progressPct}%`,
              transition: "width 0.5s ease",
              ...(currentStep > 7 ? { background: "linear-gradient(90deg, #16A34A, #22C55E)" } : {}),
            }}
          />
        </div>
      </div>

      {/* Step list */}
      <ol className="space-y-2">
        {visibleSteps.map((s, i) => {
          const state = computeState(s.step);
          const isPreStep = s.step < 0;
          const isPostStep = s.step > 7;

          return (
            <li
              key={s.step}
              role="listitem"
              data-state={state}
              data-kind={isPreStep ? "pre" : isPostStep ? "post" : "real"}
              style={{
                animationDelay:
                  state === "completed" && !isPreStep ? `${(i - PRE_STEPS.length) * 80}ms` : "0ms",
              }}
              className={`flex items-center gap-3 transition-colors duration-300 ${
                state === "completed" && !isPreStep ? "step-row-completed" : ""
              } ${isPostStep ? "step-row-enter" : ""}`}
            >
              <StepIcon state={state} step={s.step} />
              {state === "active" && s.stepName.endsWith("…") ? (
                <span className="text-primary font-medium text-sm step-name-processing">
                  {s.stepName.replace(/…+$/, "")}
                </span>
              ) : (
                <span
                  className={
                    state === "completed"
                      ? "text-text-secondary text-sm"
                      : state === "active" && s.step === 7
                        ? "text-amber-500 font-semibold text-sm"
                        : state === "active"
                          ? "text-primary font-medium text-sm"
                          : "text-text-muted text-sm"
                  }
                >
                  {s.stepName}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <style>{`
        /* Progress bar fill — gradient from blue to green as it nears completion */
        .progress-bar-fill {
          background: linear-gradient(90deg, #2563EB, #16A34A);
        }

        /* Checkmark icon: scale+rotate entrance */
        .step-icon-completed {
          animation: icon-pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes icon-pop-in {
          from {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        /* Completed row: fade+slide in with staggered delay (set via style prop) */
        .step-row-completed {
          animation: row-fade-in 0.4s ease both;
        }
        @keyframes row-fade-in {
          from {
            opacity: 0.6;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Active step: shimmer ring */
        .step-icon-active {
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
          animation: active-glow 2s ease-in-out infinite;
        }
        @keyframes active-glow {
          0%, 100% { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
          50%      { box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.40); }
        }
        .step-shimmer {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%);
          animation: shimmer-sweep 1.5s linear infinite;
        }
        @keyframes shimmer-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Final step (7): golden glow for report generation */
        .step-icon-final {
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
          animation: final-glow 1.5s ease-in-out infinite;
        }
        @keyframes final-glow {
          0%, 100% { box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25); }
          50%      { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.45); }
        }
        .step-shimmer-final {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%);
          animation: shimmer-sweep 1s linear infinite;
        }

        /* Processing dots — animated "…" for active steps */
        .step-name-processing::after {
          content: '...';
          animation: dots-fade 1.2s ease-in-out infinite;
        }
        @keyframes dots-fade {
          0%, 100% { opacity: 0.2; }
          50%      { opacity: 1; }
        }

        /* Completion: progress bar pulse + shine sweep */
        .progress-bar-complete {
          animation: complete-pulse 0.6s ease-out;
        }
        .progress-bar-complete::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
          animation: complete-shine 2.5s ease-in-out 0.6s infinite;
        }
        @keyframes complete-pulse {
          0%   { filter: brightness(1.4); transform: scaleY(1.4); }
          100% { filter: brightness(1); transform: scaleY(1); }
        }
        @keyframes complete-shine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Pre-step: pulsing dot for active warm-up step */
        .step-dot-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: white;
          animation: dot-pulse 0.8s ease-in-out infinite;
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(0.6); opacity: 0.5; }
          50%      { transform: scale(1.2); opacity: 1; }
        }

        /* Post-step: fade+slide in when wrap-up steps appear */
        .step-row-enter {
          animation: row-enter 0.35s ease both;
        }
        @keyframes row-enter {
          from {
            opacity: 0;
            transform: translateY(-6px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 40px;
          }
        }
      `}</style>
    </div>
  );
}
