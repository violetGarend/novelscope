export interface ClimaxResult {
  score: number;
  matchedKeywords: string[];
  dialogueDensity: number;
  conflictDensity: number;
}

export const KEYWORD_DICT: Record<string, string[]> = {
  reversal: [
    "打脸", "碾压", "翻身", "逆转", "翻盘", "逆袭", "反杀", "反击",
    "踩脸", "啪啪", "嚣张", "狂妄", "目中无人",
    "有眼无珠", "狗眼看人低", "不识泰山",
  ],
  shock: [
    "震撼", "目瞪口呆", "不敢相信", "惊呆", "震惊", "骇然", "愕然",
    "瞠目结舌", "大吃一惊", "不可思议", "难以置信", "匪夷所思",
    "毛骨悚然", "不寒而栗", "惊骇",
  ],
  breakthrough: [
    "突破", "晋级", "觉醒", "蜕变", "升级", "进阶", "飞升", "渡劫",
    "顿悟", "开窍", "领悟", "融会贯通", "茅塞顿开", "突飞猛进",
    "一日千里", "脱胎换骨",
  ],
  conflict: [
    "挑战", "对决", "战斗", "厮杀", "较量", "搏杀", "激战", "鏖战",
    "生死", "拼命", "赴死", "同归于尽", "以命相搏", "不死不休",
    "血战", "屠杀", "横扫",
  ],
  emotion: [
    "感动", "心酸", "热泪", "温暖", "泪目", "哽咽", "泣不成声",
    "热泪盈眶", "百感交集", "感慨万千", "心如刀割", "撕心裂肺",
    "肝肠寸断", "悲痛欲绝", "痛彻心扉",
  ],
};

function matchKeywords(text: string): string[] {
  const matched: string[] = [];
  for (const keywords of Object.values(KEYWORD_DICT)) {
    for (const kw of keywords) {
      if (text.includes(kw) && !matched.includes(kw)) {
        matched.push(kw);
      }
    }
  }
  return matched;
}

function countDialogueLines(text: string): number {
  const lines = text.split(/[\n\r]+/);
  return lines.filter((line) => /[「」""''「」]/.test(line) || /^[""]/.test(line.trim())).length;
}

function getConflictKeywords(): string[] {
  return KEYWORD_DICT.conflict;
}

export function analyzeClimax(text: string): ClimaxResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, matchedKeywords: [], dialogueDensity: 0, conflictDensity: 0 };
  }

  const charCount = text.length;
  const matchedKeywords = matchKeywords(text);
  const dialogueLines = countDialogueLines(text);
  const totalLines = text.split(/[\n\r]+/).filter((l) => l.trim().length > 0).length;
  const dialogueDensity = totalLines > 0 ? dialogueLines / totalLines : 0;

  const conflictKws = getConflictKeywords();
  const conflictHits = conflictKws.filter((kw) => text.includes(kw)).length;
  const conflictDensity = (conflictHits / charCount) * 1000;

  // Keyword density score (0-10): more keywords per 1000 chars = higher
  const keywordDensity = (matchedKeywords.length / charCount) * 1000;
  const keywordScore = Math.min(10, keywordDensity * 1.5);

  // Dialogue density bonus (0-2)
  const dialogueBonus = Math.min(2, dialogueDensity * 3);

  // Conflict density bonus (0-3)
  const conflictBonus = Math.min(3, conflictDensity * 2);

  const rawScore = keywordScore * 0.5 + dialogueBonus * 0.2 + conflictBonus * 0.3;
  const score = Math.round(Math.min(10, Math.max(0, rawScore)) * 10) / 10;

  return {
    score,
    matchedKeywords,
    dialogueDensity: Math.round(dialogueDensity * 100) / 100,
    conflictDensity: Math.round(conflictDensity * 100) / 100,
  };
}
