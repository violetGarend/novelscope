"use client";

import { useCallback } from "react";
import { ProgressBar } from "./ProgressBar";
import { ReportCard, ErrorReport } from "./ReportCard";
import { EvaluationHistory } from "./EvaluationHistory";
import { useHistoryStore, selectEntries } from "@/stores/history-store";
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

const SAMPLE_TEXTS = [
  {
    label: "示例A（动作）",
    text: `姜晚只觉得耳边风声呼啸，眼前的世界在急速倒退。他的身体不受控制地往后飞去，胸口一阵闷痛，像是被一头狂奔的犀牛撞上。

在他身后，一棵碗口粗的槐树越来越近。

"嘭！"

脊背重重砸在树干上，树叶簌簌落下。姜晚喉咙一甜，嘴角溢出一丝血迹。

"就这点本事？"对面的黑袍少年负手而立，嘴角挂着轻蔑的笑，"连我一掌都接不住，也敢来迦南学院？"`,
  },
  {
    label: "示例B（对话）",
    text: `"你真的想好了？"林晚晴放下茶杯，目光直视着对面的人。

"没什么好想的。"陈默将手中的信封推了过去，"辞呈已经写好，明天我就不去公司了。"

"就因为她？"

"不全是。"陈默站起身，走到窗边，"我只是累了。十年，我在这家公司待了十年，每天重复同样的事情。我不想再这样下去了。"

林晚晴沉默了片刻，也跟着站起来："那我跟你一起走。"

陈默转过身，有些惊讶地看着她。

"别这么看我。"林晚晴笑了笑，"我早就想走了，只是一直没下定决心。你给了我一个理由。"`,
  },
  {
    label: "示例C（描写）",
    text: `雨下了整整三天。

青石板路上积起了一个个浅浅的水洼，雨点落在上面，激起一圈圈涟漪。远处的山峦笼罩在灰蒙蒙的雨雾中，若隐若现，像一幅还未干透的水墨画。

老街两旁的店铺都关着门，只有几家茶馆还亮着昏黄的灯。偶尔有一两个撑着油纸伞的行人匆匆走过，脚步声被雨声吞没，留下一道模糊的背影。

茶馆二楼靠窗的位置，一个年轻人已经坐了一整个下午。桌上的茶换了三次，早已淡得没了味道，他却浑然不觉，只是一动不动地望着窗外。`,
  },
];

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
  const entries = useHistoryStore(selectEntries);

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
    <div className="max-w-5xl mx-auto p-8">
      {/* Two-column layout */}
      <div className="flex gap-8">
        {/* Left column: input area */}
        <div className="flex-[2] min-w-0">
          <div className="mb-8">
            <h2 className="font-display text-2xl text-text mb-1">章节评估</h2>
            <p className="text-sm text-text-muted">粘贴章节文本以获取 AI 驱动的写作质量分析报告</p>
          </div>

          {/* Input card */}
          <div className="bg-surface rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary-lighter focus-within:border-primary-light transition-all duration-200">
            <textarea
              placeholder="输入章节文本（至少1000字）..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="w-full p-5 min-h-[360px] bg-transparent border-0 focus:outline-none focus:ring-0 text-base leading-relaxed text-text placeholder:text-text-muted resize-y"
            />

            {/* Status bar */}
            <div className="border-t border-border" />
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-mono tabular-nums text-sm text-text transition-colors duration-200"
                  data-testid="char-count"
                >
                  {text.length}
                </span>
                <span className="text-sm text-text-muted">字</span>
                {text.length > 0 && text.length < 1000 && (
                  <span className="text-xs text-text-muted ml-2">（至少 1,000 字）</span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={text.length < 1000}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
                  <path d="M3 1L12 7L3 13V1Z" fill="currentColor" />
                </svg>
                开始评估
              </button>
            </div>
          </div>

          {/* Quick sample texts */}
          <div className="mt-5 flex items-center gap-2">
            <span className="text-xs text-text-muted shrink-0">快速试试：</span>
            {SAMPLE_TEXTS.map((sample) => (
              <button
                key={sample.label}
                onClick={() => setText(sample.text)}
                className="px-3 py-1 bg-primary-bg text-primary border border-primary-lighter rounded-md text-xs hover:bg-primary-lighter/30 transition-colors duration-200"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right column: auxiliary panel */}
        <div className="flex-[1] min-w-0">
          <div className="space-y-6">
            {/* 评估指南 */}
            <div className="bg-surface rounded-lg border border-border p-5">
              <h3 className="font-display text-sm text-text mb-3">评估指南</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-primary/40" />
                  至少输入 1,000 字以获得准确分析
                </li>
                <li className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-primary/40" />
                  建议粘贴完整的章节段落，而非片段
                </li>
                <li className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-primary/40" />
                  避免纯对话或超短片段，上下文越丰富分析越准确
                </li>
              </ul>
            </div>

            {/* 历史评估 */}
            <div className="bg-surface rounded-lg border border-border p-5">
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="font-display text-sm text-text">历史评估</h3>
                {entries.length > 0 && (
                  <span className="text-xs text-text-muted font-mono">最近 {entries.length} 条</span>
                )}
              </div>
              <EvaluationHistory
                onSelect={(entry) => {
                  if (entry.fullReport) {
                    useEvaluationStore.setState({ result: entry.fullReport, phase: "done" });
                  }
                }}
              />
            </div>

            {/* 写作小贴士 */}
            <div className="bg-surface rounded-lg border border-border p-5">
              <h3 className="font-display text-sm text-text mb-3">写作小贴士</h3>
              <ul className="space-y-2">
                <li className="text-xs text-text-secondary leading-relaxed">
                  黄金三章：开篇 3000 字决定读者去留，Hook 设计至关重要
                </li>
                <li className="text-xs text-text-secondary leading-relaxed">
                  爽点节奏：每 500-800 字设置一个小爽点，保持读者追读欲望
                </li>
                <li className="text-xs text-text-secondary leading-relaxed">
                  对话与描写的黄金比例建议保持在 3:7 左右
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
