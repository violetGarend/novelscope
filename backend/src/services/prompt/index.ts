import type { ClimaxResult } from "../climax";
import type { PacingResult } from "../pacing";
import type { FillerResult } from "../filler";

export interface SignalData {
  climax: ClimaxResult;
  pacing: PacingResult;
  filler: FillerResult;
}

const EVALUATION_INSTRUCTION = `你是一位专业的中文网文质量评估专家。请根据以下规则引擎提取的结构化信号，对章节进行全面评估。

评分标准（每项 0-10 分）：
- hookScore（开头吸引力）：开头是否能抓住读者，是否有悬念或冲突
- climaxScore（高潮质量）：爽点密度、反转频率、冲突强度
- cliffhangerScore（章末悬念）：结尾是否有钩子，是否让读者想继续看
- pacingScore（节奏感）：段落类型多样性、张力变化、是否有注水

请严格按以下 JSON 格式输出，不要输出其他内容：
{
  "hookScore": <0-10>,
  "climaxScore": <0-10>,
  "cliffhangerScore": <0-10>,
  "pacingScore": <0-10>,
  "consistencyIssues": ["<问题1>", ...],
  "highlights": ["<亮点1>", ...],
  "suggestions": ["<建议1>", ...]
}`;

function formatClimaxSignal(climax: ClimaxResult): string {
  const lines: string[] = ["【爽点分析信号】"];
  lines.push(`  参考分数: ${climax.score}/10`);
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

function formatPacingSignal(pacing: PacingResult): string {
  const lines: string[] = ["【节奏分析信号】"];
  lines.push(`  参考分数: ${pacing.score}/10`);
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

function formatFillerSignal(filler: FillerResult): string {
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

export function buildEvaluationPrompt(signals: SignalData): string {
  const sections = [
    EVALUATION_INSTRUCTION,
    "",
    "以下是规则引擎提取的结构化信号，请结合原文进行评估：",
    "",
    formatClimaxSignal(signals.climax),
    "",
    formatPacingSignal(signals.pacing),
    "",
    formatFillerSignal(signals.filler),
  ];

  return sections.join("\n");
}
