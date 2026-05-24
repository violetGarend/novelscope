export interface HookFeatures {
  openingType: "conflict" | "suspense" | "dialogue" | "description" | "mixed";
  hasQuestion: boolean;
  hasGoldenLine: boolean;
  conflictHitCount: number;
  suspenseHitCount: number;
}

const CONFLICT_KEYWORDS = [
  "杀", "战", "死", "血", "冲", "逃", "追", "夺", "抢",
  "爆发", "出手", "刺杀", "偷袭", "围攻", "突围", "搏斗",
  "怒吼", "暴喝", "一击", "斩杀", "血战", "拼命",
];

const SUSPENSE_KEYWORDS = [
  "发现", "秘密", "真相", "竟然", "原来", "隐藏",
  "古怪", "异常", "不对劲", "诡异", "神秘", "消失",
  "出现", "异变", "突变", "变故", "意外",
  "难道", "莫非", "怎么可能", "不可思议",
];

const DIALOGUE_MARKERS = /[“”‘’「」『』:：]/;

function hasQuestion(paragraph: string): boolean {
  return /[？?]/.test(paragraph);
}

function hasExclamation(paragraph: string): boolean {
  return /[！!]/.test(paragraph);
}

function countKeywordHits(text: string, keywords: string[]): number {
  let hits = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) hits++;
  }
  return hits;
}

function isGoldenLine(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  // Short impactful statements (10-40 chars) with emotional/exclamatory tone
  if (trimmed.length < 10 || trimmed.length > 50) return false;
  // Strong declarative with ! or ！, or rhetorical question
  if (hasExclamation(trimmed)) return true;
  // Pithy philosophical/emotional statement patterns
  const goldenPatterns = [
    "人生", "命运", "天道", "这一", "我命", "天不",
    "唯有", "世上", "世间", "天下", "从来", "永远",
  ];
  return goldenPatterns.some((p) => trimmed.includes(p));
}

function classifyOpeningType(paragraphs: string[]): HookFeatures["openingType"] {
  const firstTwo = paragraphs.slice(0, 2).join("\n");
  const hasConflict = CONFLICT_KEYWORDS.some((k) => firstTwo.includes(k));
  const hasSuspense = SUSPENSE_KEYWORDS.some((k) => firstTwo.includes(k));
  const hasDialogue = DIALOGUE_MARKERS.test(firstTwo);

  if (hasConflict && hasSuspense) return "mixed";
  if (hasConflict) return "conflict";
  if (hasSuspense) return "suspense";
  if (hasDialogue) return "dialogue";
  return "description";
}

export function analyzeHook(text: string): HookFeatures {
  if (!text || text.trim().length === 0) {
    return {
      openingType: "description",
      hasQuestion: false,
      hasGoldenLine: false,
      conflictHitCount: 0,
      suspenseHitCount: 0,
    };
  }

  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) {
    return {
      openingType: "description",
      hasQuestion: false,
      hasGoldenLine: false,
      conflictHitCount: 0,
      suspenseHitCount: 0,
    };
  }

  // Analyze first 5 paragraphs (or fewer if short)
  const openingParas = paragraphs.slice(0, Math.min(5, paragraphs.length));
  const openingText = openingParas.join("\n");

  const conflictHits = countKeywordHits(openingText, CONFLICT_KEYWORDS);
  const suspenseHits = countKeywordHits(openingText, SUSPENSE_KEYWORDS);
  const questionInOpening = openingParas.some(hasQuestion);
  const goldenLine = openingParas.some(isGoldenLine);
  const openingType = classifyOpeningType(openingParas);

  return {
    openingType,
    hasQuestion: questionInOpening,
    hasGoldenLine: goldenLine,
    conflictHitCount: conflictHits,
    suspenseHitCount: suspenseHits,
  };
}
