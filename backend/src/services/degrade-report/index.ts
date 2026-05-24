import type { AllFeatures } from "../pipeline/types";

export function generateDegradeReport(features: AllFeatures, reason?: string): string {
  const lines: string[] = [];

  // Header
  lines.push("【AI 评估暂不可用 — 以下为规则引擎自动分析】");
  lines.push("");
  if (reason) {
    lines.push(`原因: ${reason}`);
    lines.push("");
  }

  // Summary
  const openingLabel = OPENING_LABELS[features.hook.openingType] ?? features.hook.openingType;
  const endingLabel = ENDING_LABELS[features.cliffhanger.endingType] ?? features.cliffhanger.endingType;
  const dialogueLevel = tierLabel(features.climax.dialogueDensity, 0.5, 0.3);
  lines.push(`本章以${openingLabel}开头，对话密度${dialogueLevel}，章末采用${endingLabel}。`);
  lines.push("");

  // Hook section
  lines.push("## 开头分析");
  lines.push(formatHookSection(features));
  lines.push("");

  // Climax section
  lines.push("## 爽点分析");
  lines.push(formatClimaxSection(features));
  lines.push("");

  // Cliffhanger section
  lines.push("## 章末悬念");
  lines.push(formatCliffhangerSection(features));
  lines.push("");

  // Pacing section
  lines.push("## 节奏分析");
  lines.push(formatPacingSection(features));
  lines.push("");

  // Filler section
  lines.push("## 注水检测");
  lines.push(formatFillerSection(features));
  lines.push("");

  // Footer
  lines.push("---");
  lines.push("*以上为规则引擎自动分析，AI 深度评估暂时不可用。请稍后重试。*");

  return lines.join("\n");
}

// ── Label maps ──

const OPENING_LABELS: Record<string, string> = {
  conflict: "冲突型开头",
  suspense: "悬念型开头",
  dialogue: "对话型开头",
  description: "描写型开头",
  mixed: "混合型开头",
};

const ENDING_LABELS: Record<string, string> = {
  suspense: "悬念收尾",
  question: "疑问收尾",
  emotional: "情绪收尾",
  reversal: "反转收尾",
  action: "行动收尾",
  flat: "平坦收尾",
};

// ── Severity helpers ──

function tierLabel(value: number, high: number, low: number): string {
  if (value >= high) return "较高";
  if (value >= low) return "适中";
  return "偏低";
}

function countTier(value: number, high: number, low: number): string {
  if (value >= high) return "密集";
  if (value >= low) return "适中";
  return "较少";
}

// ── Section formatters ──

function formatHookSection(f: AllFeatures): string {
  const openingLabel = OPENING_LABELS[f.hook.openingType] ?? f.hook.openingType;
  const conflictLevel = countTier(f.hook.conflictHitCount, 5, 2);
  const suspenseLevel = countTier(f.hook.suspenseHitCount, 5, 2);

  const parts = [
    `开头类型为「${openingLabel}」，冲突关键词命中 ${f.hook.conflictHitCount} 处（${conflictLevel}），悬念关键词命中 ${f.hook.suspenseHitCount} 处（${suspenseLevel}）。`,
  ];

  if (f.hook.hasQuestion) {
    parts.push("开头包含疑问句，具有悬念引导作用。");
  }
  if (f.hook.hasGoldenLine) {
    parts.push("检测到标志性金句，有助于迅速抓住读者注意力。");
  }

  return parts.join("");
}

function formatClimaxSection(f: AllFeatures): string {
  const keywordCount = f.climax.matchedKeywords.length;
  const kwLevel = countTier(keywordCount, 5, 2);
  const dialogueLevel = tierLabel(f.climax.dialogueDensity, 0.5, 0.3);
  const conflictLevel = tierLabel(f.climax.conflictDensity, 0.5, 0.3);

  const parts: string[] = [];

  if (keywordCount > 0) {
    const categories = Object.entries(f.climax.keywordCategories)
      .filter(([, kw]) => kw.length > 0)
      .map(([cat, kw]) => `${CATEGORY_LABELS[cat] ?? cat}(${kw.join("、")})`);
    parts.push(`命中爽点关键词 ${keywordCount} 处（${kwLevel}）：${categories.join("；")}。`);
  } else {
    parts.push("未命中爽点关键词。");
  }

  parts.push(`对话密度${dialogueLevel}，冲突密度${conflictLevel}。`);

  return parts.join("");
}

const CATEGORY_LABELS: Record<string, string> = {
  reversal: "打脸/反转",
  shock: "震惊/震撼",
  breakthrough: "突破/升级",
  conflict: "冲突/对抗",
  emotion: "情绪/感动",
};

function formatCliffhangerSection(f: AllFeatures): string {
  const endingLabel = ENDING_LABELS[f.cliffhanger.endingType] ?? f.cliffhanger.endingType;
  const suspenseLevel = countTier(f.cliffhanger.suspenseHitCount, 5, 2);

  const parts = [
    `结尾类型为「${endingLabel}」，悬念关键词命中 ${f.cliffhanger.suspenseHitCount} 处（${suspenseLevel}）。`,
  ];

  if (f.cliffhanger.hasQuestion) {
    parts.push("章末包含疑问句，增强读者好奇心。");
  }
  if (f.cliffhanger.hasReversalHint) {
    parts.push("检测到反转暗示，预示后续情节转折。");
  }
  if (!f.cliffhanger.hasQuestion && !f.cliffhanger.hasReversalHint && f.cliffhanger.suspenseHitCount < 2) {
    parts.push("章末悬念较弱，建议加强钩子设计以提升追读率。");
  }

  return parts.join("");
}

function formatPacingSection(f: AllFeatures): string {
  const actionPct = Math.round(f.pacing.typeRatio.action * 100);
  const dialoguePct = Math.round(f.pacing.typeRatio.dialogue * 100);
  const descriptionPct = Math.round(f.pacing.typeRatio.description * 100);

  const parts = [
    `段落数 ${f.pacing.curve.length > 0 ? f.pacing.curve.length : "未知"}，变异系数 ${f.pacing.cv}。`,
    `动作/对话/描写比例为 ${actionPct}%/${dialoguePct}%/${descriptionPct}%。`,
  ];

  if (actionPct >= 50) {
    parts.push("动作占比偏高，节奏紧凑但需注意避免单调。");
  } else if (descriptionPct >= 50) {
    parts.push("描写占比偏高，节奏偏慢，建议增加对话或动作场景调节。");
  } else if (dialoguePct >= 50) {
    parts.push("对话占比偏高，适合推进剧情和人物关系。");
  } else {
    parts.push("节奏类型分布较为均衡。");
  }

  if (f.pacing.cv > 0.8) {
    parts.push("张力变异系数较高，节奏起伏明显。");
  } else if (f.pacing.cv > 0.4) {
    parts.push("张力变异系数适中，节奏有一定波动。");
  }

  return parts.join("");
}

function formatFillerSection(f: AllFeatures): string {
  const itemCount = f.filler.items.length;
  const pairCount = f.filler.suspiciousPairs.length;

  if (itemCount === 0 && pairCount === 0) {
    return "未检测到明显注水段落或重复内容。";
  }

  const parts: string[] = [];
  if (itemCount > 0) {
    const level = itemCount >= 3 ? "较多" : "少量";
    parts.push(`检测到 ${itemCount} 处疑似注水段落（${level}）。`);
  }
  if (pairCount > 0) {
    const level = pairCount >= 3 ? "较多" : "少量";
    parts.push(`检测到 ${pairCount} 对疑似重复段落（${level}）。`);
  }

  return parts.join("");
}
