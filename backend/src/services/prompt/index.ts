import type { ClimaxFeatures } from "../climax";
import type { PacingFeatures } from "../pacing";
import type { FillerFeatures } from "../filler";
import type { HookFeatures } from "../hook";
import type { CliffhangerFeatures } from "../cliffhanger";

export interface SignalData {
  climax: ClimaxFeatures;
  pacing: PacingFeatures;
  filler: FillerFeatures;
  hook: HookFeatures;
  cliffhanger: CliffhangerFeatures;
}

export interface BuildPromptResult {
  prompt: string;
  needsTruncation: boolean;
  truncatedFeatures: string[];
}

export interface PromptConfig {
  useV1?: boolean;
}

// ── 6锚点评分体系（4维度 × 6级别，共24个锚点，全部中文网文风格） ──

const HOOK_ANCHORS = `
[0] 开头是平淡的景色描写或大段背景介绍，毫无冲突与悬念，读者可能直接划走
[2] 开头有简单场景交代但节奏拖沓，或对话开场却缺乏张力，仅能勉强留住耐心读者
[4] 开头有基本的场景设定与轻微悬念（如一句暗示或一个小疑问），但不够抓人
[6] 开头有明确冲突或悬念抛出，能在黄金三秒内引起读者好奇心，如"醒来发现被困密室"
[8] 开头直接抛出强冲突或高悬念——如追杀开场、身份揭穿、逆天金手指激活，读者被迅速拉入情境
[10] 开头即是名场面：强冲突+悬念+金句同时炸开，如"萧炎回到萧家满地尸体，手中婚书化为灰烬"级别`;

const CLIMAX_ANCHORS = `
[0] 全章无任何爽点，情节推进为零，读者读完毫无情绪波动
[2] 仅有1-2处轻微爽点（如简单击败小喽啰），但缺乏震撼感与情绪共鸣
[4] 有2-3处中等爽点但密度偏低，或爽点质量一般（如平淡的突破/简单打脸），尚可但不出彩
[6] 爽点分布合理，有2-3处较强爽点——包含打脸、碾压、突破、反转等至少两种类型，情绪有起伏
[8] 爽点密集且层次丰富：多重反转、连续打脸、碾压+突破组合拳，读者有多次"爽到"的峰值体验
[10] 名场面级别：密集爽点+多重反转+情绪爆发+金句收尾，如"三十年河东三十年河西，莫欺少年穷"级别的经典高潮`;

const CLIFFHANGER_ANCHORS = `
[0] 章末平淡收尾，故事完全闭合，无任何悬念钩子或未完线索，读者可随时放下
[2] 有轻微情绪余韵（如一句感慨或抒情收束），但无实质性悬念驱动翻页
[4] 章末有基本收束但留下一处微弱悬念或未答问题，读者有一定继续阅读意愿
[6] 章末有明显悬念或未解冲突——如新敌人登场、关键信息被截断、角色面临两难抉择
[8] 章末有强悬念或反转预告——在最关键处设钩，读者有强烈欲望点开下一章一探究竟
[10] 断章神级：在最紧张处戛然而止，关键信息差一步揭露，读者抓心挠肝骂"断章狗"但仍立刻点下一章`;

const PACING_ANCHORS = `
[0] 节奏单一无变化：全章同一类型段落（全是描写/全是对话），读者极易疲劳弃书
[2] 节奏变化极少，段落类型高度同质化，或存在大段连续描写/说明性文字拖慢进度
[4] 有一定节奏变化但不够丰富：动作/对话/描写比例失衡，或存在明显注水段落
[6] 节奏有张有弛：动作、对话、描写比例基本合理，段落长短有变化，读者阅读体验顺畅
[8] 节奏变化丰富：段落类型切换自然，长短段交错有致，张力曲线起伏分明，张弛有度
[10] 节奏掌控大师级：段落长短节奏与剧情情绪精准匹配，快慢切换如呼吸，读者完全沉浸无暇喘息`;

// ── 软化分布措辞 ──

const DISTRIBUTION_GUIDANCE = `请充分利用 0-10 全量程进行评分。优秀的章节应在相应维度获得高分（8-10），
平庸的章节应获得中等分数（4-6），质量较差的章节应获得低分（0-3）。
如果多个维度的评分确实都处于中等水平，这是可以接受的——
请保持评分的诚实性，而非为了区分而强行拉大分数差距。`;

// ── 评估指令 ──

function buildInstruction(): string {
  return `<instruction>
你是一位专业的中文网文质量评估专家。请根据以下规则引擎提取的结构化文本特征，结合锚点评分标准，对章节进行全面评估。

评分维度（每项 0-10 分）：
- hookScore（开头吸引力）：开头能否抓住读者，是否有悬念或冲突
- climaxScore（高潮质量）：爽点密度、反转频率、冲突强度
- cliffhangerScore（章末悬念）：结尾是否有钩子，是否让读者想继续看
- pacingScore（节奏感）：段落类型多样性、张力变化、是否有注水

${DISTRIBUTION_GUIDANCE}

改进建议请按严重度分级（critical=关键问题/必须修改，warning=建议优化，info=观察/小建议），每条建议需包含：
- severity: 严重度
- location: 问题定位（如"开头300字"、"中段对话"、"结尾章节"）
- issue: 具体问题描述
- direction: 可操作的具体改进方向

请严格按以下 JSON 格式输出，不要输出其他内容：
{
  "hookScore": <0-10>,
  "climaxScore": <0-10>,
  "cliffhangerScore": <0-10>,
  "pacingScore": <0-10>,
  "consistencyIssues": ["<问题1>", ...],
  "highlights": ["<亮点1>", ...],
  "suggestions": [
    { "severity": "critical|warning|info", "location": "<定位>", "issue": "<问题>", "direction": "<改进方向>" },
    ...
  ]
}
</instruction>`;
}

// ── 锚点区块 ──

function buildAnchorsSection(): string {
  return `<anchors>
<hook_anchors>
${HOOK_ANCHORS}
</hook_anchors>

<climax_anchors>
${CLIMAX_ANCHORS}
</climax_anchors>

<cliffhanger_anchors>
${CLIFFHANGER_ANCHORS}
</cliffhanger_anchors>

<pacing_anchors>
${PACING_ANCHORS}
</pacing_anchors>
</anchors>`;
}

// ── 特征格式化 ──

function formatHookSignal(hook: HookFeatures): string {
  const lines: string[] = ["<hook_features>"];
  const typeLabels: Record<HookFeatures["openingType"], string> = {
    conflict: "冲突开场",
    suspense: "悬念开场",
    dialogue: "对话开场",
    description: "描写开场",
    mixed: "混合开场（冲突+悬念）",
  };
  lines.push(`  开头类型: ${typeLabels[hook.openingType]} (${hook.openingType})`);
  lines.push(`  含疑问句: ${hook.hasQuestion ? "是" : "否"}`);
  lines.push(`  含金句: ${hook.hasGoldenLine ? "是" : "否"}`);
  lines.push(`  冲突关键词命中: ${hook.conflictHitCount} 处`);
  lines.push(`  悬念关键词命中: ${hook.suspenseHitCount} 处`);
  lines.push("</hook_features>");
  return lines.join("\n");
}

function formatClimaxSignal(climax: ClimaxFeatures): string {
  const lines: string[] = ["<climax_features>"];
  lines.push(`  命中关键词: ${climax.matchedKeywords.length > 0 ? climax.matchedKeywords.join("、") : "无"}`);

  const categoryLabels: Record<string, string> = {
    reversal: "反转打脸",
    shock: "震撼惊骇",
    breakthrough: "突破蜕变",
    conflict: "战斗冲突",
    emotion: "情绪催泪",
  };
  const filledCategories = Object.entries(climax.keywordCategories)
    .filter(([, kws]) => kws.length > 0);
  if (filledCategories.length > 0) {
    lines.push("  关键词分类:");
    for (const [cat, kws] of filledCategories) {
      lines.push(`    ${categoryLabels[cat] ?? cat} (${cat}): ${kws.join("、")}`);
    }
  }

  lines.push(`  对话密度: ${climax.dialogueDensity}`);
  lines.push(`  冲突密度: ${climax.conflictDensity}`);
  lines.push("</climax_features>");
  return lines.join("\n");
}

function formatPacingSignal(pacing: PacingFeatures): string {
  const lines: string[] = ["<pacing_features>"];
  lines.push(`  段落数: ${pacing.curve.length}`);
  lines.push(`  变异系数(CV): ${pacing.cv}（越高表示段落长度变化越大）`);
  lines.push(`  类型比例: 动作${Math.round(pacing.typeRatio.action * 100)}% / 对话${Math.round(pacing.typeRatio.dialogue * 100)}% / 描写${Math.round(pacing.typeRatio.description * 100)}%`);

  if (pacing.curve.length > 0) {
    const tensions = pacing.curve.map((p) => p.tension);
    const avgTension = tensions.reduce((a, b) => a + b, 0) / tensions.length;
    lines.push(`  平均张力: ${Math.round(avgTension * 10) / 10}`);
    lines.push(`  张力范围: ${Math.min(...tensions)} - ${Math.max(...tensions)}`);
  }

  lines.push("</pacing_features>");
  return lines.join("\n");
}

function formatFillerSignal(filler: FillerFeatures): string {
  const lines: string[] = ["<filler_features>"];
  lines.push(`  疑似注水段落: ${filler.items.length} 处`);

  if (filler.items.length > 0) {
    for (const item of filler.items) {
      lines.push(`  - 第${item.paragraph}段: ${item.reason} | 建议: ${item.suggestion}`);
    }
  }

  if (filler.suspiciousPairs.length > 0) {
    lines.push(`  可疑相似段落对: ${filler.suspiciousPairs.length} 组`);
    for (const pair of filler.suspiciousPairs) {
      lines.push(`    第${pair.paragraphA}段 ↔ 第${pair.paragraphB}段 (相似度: ${Math.round(pair.similarity * 100)}%)`);
    }
  }

  lines.push("</filler_features>");
  return lines.join("\n");
}

function formatCliffhangerSignal(cliffhanger: CliffhangerFeatures): string {
  const lines: string[] = ["<cliffhanger_features>"];
  const typeLabels: Record<CliffhangerFeatures["endingType"], string> = {
    suspense: "悬念收尾",
    question: "疑问收尾",
    emotional: "情绪收尾",
    reversal: "反转收尾",
    action: "行动收尾（未完冲突）",
    flat: "平坦收尾",
  };
  lines.push(`  结尾类型: ${typeLabels[cliffhanger.endingType]} (${cliffhanger.endingType})`);
  lines.push(`  含疑问句: ${cliffhanger.hasQuestion ? "是" : "否"}`);
  lines.push(`  含反转暗示: ${cliffhanger.hasReversalHint ? "是" : "否"}`);
  lines.push(`  悬念关键词命中: ${cliffhanger.suspenseHitCount} 处`);
  lines.push("</cliffhanger_features>");
  return lines.join("\n");
}

function buildFeaturesSection(signals: SignalData): string {
  const sections = [
    "【开头分析信号】",
    formatHookSignal(signals.hook),
    "",
    "【爽点分析信号】",
    formatClimaxSignal(signals.climax),
    "",
    "【节奏分析信号】",
    formatPacingSignal(signals.pacing),
    "",
    "【注水检测信号】",
    formatFillerSignal(signals.filler),
    "",
    "【章末悬念信号】",
    formatCliffhangerSignal(signals.cliffhanger),
  ];
  return `<features>\n${sections.join("\n")}\n</features>`;
}

// ── Token 估算 ──

const ESTIMATED_TOKEN_THRESHOLD = 6000;

function estimateTokens(text: string): number {
  let tokens = 0;
  for (const ch of text) {
    // CJK characters ~2 tokens, ASCII ~0.3 tokens in most tokenizers
    if (/[一-鿿㐀-䶿]/.test(ch)) {
      tokens += 2;
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      tokens += 0.3;
    } else {
      tokens += 1;
    }
  }
  return Math.ceil(tokens);
}

// ── v1 fallback (保留旧格式便于 AB 对比) ──

const EVALUATION_INSTRUCTION_V1 = `你是一位专业的中文网文质量评估专家。请根据以下规则引擎提取的结构化信号，对章节进行全面评估。

评分标准（每项 0-10 分）：
- hookScore（开头吸引力）：开头是否能抓住读者，是否有悬念或冲突
- climaxScore（高潮质量）：爽点密度、反转频率、冲突强度
- cliffhangerScore（章末悬念）：结尾是否有钩子，是否让读者想继续看
- pacingScore（节奏感）：段落类型多样性、张力变化、是否有注水

改进建议请按严重度分级（critical=关键问题/必须修改，warning=建议优化，info=观察/小建议），每条建议需包含：
- severity: 严重度
- location: 问题定位（如"开头300字"、"中段对话"、"结尾章节"）
- issue: 具体问题描述
- direction: 可操作的具体改进方向

请严格按以下 JSON 格式输出，不要输出其他内容：
{
  "hookScore": <0-10>,
  "climaxScore": <0-10>,
  "cliffhangerScore": <0-10>,
  "pacingScore": <0-10>,
  "consistencyIssues": ["<问题1>", ...],
  "highlights": ["<亮点1>", ...],
  "suggestions": [
    { "severity": "critical|warning|info", "location": "<定位>", "issue": "<问题>", "direction": "<改进方向>" },
    ...
  ]
}`;

function formatClimaxSignalV1(climax: ClimaxFeatures): string {
  const lines: string[] = ["【爽点分析信号】"];
  lines.push(`  命中关键词: ${climax.matchedKeywords.length > 0 ? climax.matchedKeywords.join("、") : "无"}`);

  const categoryLines: string[] = [];
  for (const [cat, kws] of Object.entries(climax.keywordCategories)) {
    if (kws.length > 0) {
      categoryLines.push(`    ${cat}: ${kws.join("、")}`);
    }
  }
  if (categoryLines.length > 0) {
    lines.push("  关键词分类:");
    lines.push(...categoryLines);
  }

  lines.push(`  对话密度: ${climax.dialogueDensity}`);
  lines.push(`  冲突密度: ${climax.conflictDensity}`);
  return lines.join("\n");
}

function formatPacingSignalV1(pacing: PacingFeatures): string {
  const lines: string[] = ["【节奏分析信号】"];
  lines.push(`  段落数: ${pacing.curve.length}`);
  lines.push(`  变异系数(CV): ${pacing.cv}（越高表示段落长度变化越大）`);
  lines.push(`  类型比例: 动作${Math.round(pacing.typeRatio.action * 100)}% / 对话${Math.round(pacing.typeRatio.dialogue * 100)}% / 描写${Math.round(pacing.typeRatio.description * 100)}%`);

  if (pacing.curve.length > 0) {
    const tensions = pacing.curve.map((p) => p.tension);
    const avgTension = tensions.reduce((a, b) => a + b, 0) / tensions.length;
    lines.push(`  平均张力: ${Math.round(avgTension * 10) / 10}`);
    lines.push(`  张力范围: ${Math.min(...tensions)} - ${Math.max(...tensions)}`);
  }

  return lines.join("\n");
}

function formatFillerSignalV1(filler: FillerFeatures): string {
  const lines: string[] = ["【注水检测信号】"];
  lines.push(`  疑似注水段落: ${filler.items.length} 处`);

  if (filler.items.length > 0) {
    for (const item of filler.items) {
      lines.push(`  - ${item.reason}`);
    }
  }

  if (filler.suspiciousPairs.length > 0) {
    lines.push(`  可疑相似段落对: ${filler.suspiciousPairs.length} 组`);
    for (const pair of filler.suspiciousPairs) {
      lines.push(`    第${pair.paragraphA}段 ↔ 第${pair.paragraphB}段 (相似度: ${Math.round(pair.similarity * 100)}%)`);
    }
  }

  return lines.join("\n");
}

function formatHookSignalV1(hook: HookFeatures): string {
  const lines: string[] = ["【开头分析信号】"];
  const typeLabels: Record<HookFeatures["openingType"], string> = {
    conflict: "冲突开场",
    suspense: "悬念开场",
    dialogue: "对话开场",
    description: "描写开场",
    mixed: "混合开场",
  };
  lines.push(`  开头类型: ${typeLabels[hook.openingType]}`);
  lines.push(`  含疑问句: ${hook.hasQuestion ? "是" : "否"}`);
  lines.push(`  含金句: ${hook.hasGoldenLine ? "是" : "否"}`);
  lines.push(`  冲突词命中: ${hook.conflictHitCount} | 悬念词命中: ${hook.suspenseHitCount}`);
  return lines.join("\n");
}

function formatCliffhangerSignalV1(cliffhanger: CliffhangerFeatures): string {
  const lines: string[] = ["【章末悬念信号】"];
  const typeLabels: Record<CliffhangerFeatures["endingType"], string> = {
    suspense: "悬念收尾",
    question: "疑问收尾",
    emotional: "情绪收尾",
    reversal: "反转收尾",
    action: "行动收尾",
    flat: "平坦收尾",
  };
  lines.push(`  结尾类型: ${typeLabels[cliffhanger.endingType]}`);
  lines.push(`  含疑问句: ${cliffhanger.hasQuestion ? "是" : "否"}`);
  lines.push(`  含反转暗示: ${cliffhanger.hasReversalHint ? "是" : "否"}`);
  lines.push(`  悬念词命中: ${cliffhanger.suspenseHitCount}`);
  return lines.join("\n");
}

function buildV1Prompt(signals: SignalData): string {
  const sections = [
    EVALUATION_INSTRUCTION_V1,
    "",
    "以下是规则引擎提取的结构化信号，请结合原文进行评估：",
    "",
    formatClimaxSignalV1(signals.climax),
    "",
    formatPacingSignalV1(signals.pacing),
    "",
    formatFillerSignalV1(signals.filler),
    "",
    formatHookSignalV1(signals.hook),
    "",
    formatCliffhangerSignalV1(signals.cliffhanger),
  ];
  return sections.join("\n");
}

// ── 主入口 ──

export function buildEvaluationPrompt(
  signals: SignalData,
  config?: PromptConfig
): BuildPromptResult {
  if (config?.useV1) {
    return {
      prompt: buildV1Prompt(signals),
      needsTruncation: false,
      truncatedFeatures: [],
    };
  }

  const featuresSection = buildFeaturesSection(signals);
  const instruction = buildInstruction();
  const anchors = buildAnchorsSection();

  // 截断检测：仅检测 features 区块（instruction + anchors 长度固定）
  const featuresTokens = estimateTokens(featuresSection);
  const needsTruncation = featuresTokens > ESTIMATED_TOKEN_THRESHOLD;

  const truncatedFeatures: string[] = [];
  if (needsTruncation) {
    // 按引擎维度报告哪些区块需要截断
    const hookTokens = estimateTokens(formatHookSignal(signals.hook));
    const climaxTokens = estimateTokens(formatClimaxSignal(signals.climax));
    const pacingTokens = estimateTokens(formatPacingSignal(signals.pacing));
    const fillerTokens = estimateTokens(formatFillerSignal(signals.filler));
    const cliffhangerTokens = estimateTokens(formatCliffhangerSignal(signals.cliffhanger));

    if (climaxTokens > ESTIMATED_TOKEN_THRESHOLD / 5) truncatedFeatures.push("爽点分析");
    if (pacingTokens > ESTIMATED_TOKEN_THRESHOLD / 5) truncatedFeatures.push("节奏分析");
    if (fillerTokens > ESTIMATED_TOKEN_THRESHOLD / 5) truncatedFeatures.push("注水检测");
    if (hookTokens > ESTIMATED_TOKEN_THRESHOLD / 5) truncatedFeatures.push("开头分析");
    if (cliffhangerTokens > ESTIMATED_TOKEN_THRESHOLD / 5) truncatedFeatures.push("章末悬念");

    if (truncatedFeatures.length === 0) {
      truncatedFeatures.push("综合特征");
    }
  }

  const prompt = [instruction, "", anchors, "", featuresSection].join("\n");

  return { prompt, needsTruncation, truncatedFeatures };
}
