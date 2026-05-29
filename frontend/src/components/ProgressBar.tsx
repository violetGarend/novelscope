"use client";

export interface StepDef {
  step: number;
  stepName: string;
}

export const EVALUATION_STEPS: StepDef[] = [
  { step: 1, stepName: "正在验证文本" },
  { step: 2, stepName: "分析爽点密度" },
  { step: 3, stepName: "分析节奏" },
  { step: 4, stepName: "构建 AI 提示" },
  { step: 5, stepName: "调用 AI 分析" },
  { step: 6, stepName: "处理 AI 结果" },
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

const STEP_DESC: Record<number, string> = {
  [-2]: "启动引擎",
  [-1]: "准备模型",
  1: "检查文本格式",
  2: "关键词匹配",
  3: "解析段落张力曲线",
  4: "构建上下文",
  5: "调用 AI 服务",
  6: "解析 AI 响应",
  7: "生成报告",
  8: "汇总数据",
  9: "输出结果",
};

interface ProgressBarProps {
  currentStep: number;
  currentStepName?: string;
}

function WaveAnimation() {
  return (
    <span className="inline-flex items-center gap-[3px] h-5 wave-status">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[3px] bg-primary rounded-full wave-bar"
          style={{
            height: `${[8, 14, 18, 12, 16][i]}px`,
            animationDelay: `${[0, 0.1, 0.2, 0.3, 0.15][i]}s`,
          }}
        />
      ))}
    </span>
  );
}

export function ProgressBar({ currentStep, currentStepName }: ProgressBarProps) {
  const progressPct = Math.min(100, Math.round((currentStep / 7) * 100));

  const visibleSteps = [
    ...PRE_STEPS,
    ...EVALUATION_STEPS,
    ...(currentStep >= 7 ? POST_STEPS : []),
  ];

  function computeState(step: number): "completed" | "active" | "pending" {
    if (step < 0) {
      if (currentStep >= 1) return "completed";
      if (currentStep === 0 && step === -1) return "active";
      return "pending";
    }
    if (step <= 7) {
      if (currentStep > 7 || currentStep > step) return "completed";
      if (currentStep === step) return "active";
      return "pending";
    }
    if (currentStep > 7) return "completed";
    if (currentStep === 7 && step === 8) return "active";
    return "pending";
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-1.5">
        <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
          <div
            className="h-full rounded-full progress-fill-bar"
            style={{
              width: `${progressPct}%`,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs text-text-muted mb-7">
        <span className="text-primary font-medium">
          {currentStep > 7 ? "评估完成" : `步骤 ${currentStep} / 7`}
        </span>
        <span className="font-mono tabular-nums">{progressPct}%</span>
      </div>

      {/* Step list */}
      <ol className="space-y-1">
        {visibleSteps.map((s) => {
          const state = computeState(s.step);
          const desc = STEP_DESC[s.step] ?? "";

          return (
            <li
              key={s.step}
              role="listitem"
              data-state={state}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-colors duration-300 ${
                state === "active" ? "bg-primary-bg" : ""
              } ${state === "completed" ? "step-row-done" : ""}`}
            >
              {/* Icon */}
              {state === "completed" ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-bg text-success text-sm font-bold step-icon-pop">
                  ✓
                </span>
              ) : state === "active" ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-xs font-mono font-medium">
                  {s.step > 0 ? s.step : ""}
                </span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-border/30 text-text-muted/50 text-xs font-mono">
                  {s.step > 0 ? s.step : "·"}
                </span>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    state === "completed"
                      ? "text-success"
                      : state === "active"
                        ? "text-text"
                        : "text-text-muted/60"
                  }`}
                >
                  {s.stepName}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    state === "active" ? "text-primary-light" : "text-text-muted/50"
                  }`}
                >
                  {state === "active" && currentStepName
                    ? currentStepName.replace(/…+$/, "")
                    : desc}
                </p>
              </div>

              {/* Right side: wave for active, nothing for others */}
              {state === "active" && <WaveAnimation />}
            </li>
          );
        })}
      </ol>

      <style>{`
        .progress-fill-bar {
          background: linear-gradient(90deg, #2563EB, #3B82F6);
        }
        .step-icon-pop {
          animation: icon-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes icon-in {
          from { transform: scale(0) rotate(-45deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .step-row-done {
          animation: row-in 0.3s ease both;
        }
        @keyframes row-in {
          from { opacity: 0.5; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .wave-bar {
          animation: wave-jump 0.8s ease-in-out infinite;
        }
        @keyframes wave-jump {
          0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
