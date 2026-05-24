export interface CliffhangerFeatures {
  endingType: "suspense" | "question" | "emotional" | "reversal" | "action" | "flat";
  hasQuestion: boolean;
  hasReversalHint: boolean;
  suspenseHitCount: number;
}

const SUSPENSE_KEYWORDS = [
  "突然", "忽然", "就在这时", "下一刻", "紧接着",
  "猛然", "骤然", "陡然", "刹那",
  "难道", "究竟", "到底",
];

const REVERSAL_HINT_KEYWORDS = [
  "竟然", "没想到", "不料", "谁知", "岂料",
  "反而", "反倒", "却是", "居然是",
];

const UNRESOLVED_CONFLICT_KEYWORDS = [
  "杀", "战", "打", "冲", "追", "逃", "夺",
  "袭来", "扑来", "冲来", "杀来",
];

const EMOTION_HOOK_KEYWORDS = [
  "泪", "哭", "笑", "怒", "恨", "痛", "惊",
  "心", "颤抖", "激动", "绝望", "希望",
];

const RESOLUTION_MARKERS = [
  "结束", "完成", "终于", "总算", "告一段落",
  "松了一口气", "放下心来", "安心",
];

function hasQuestion(paragraph: string): boolean {
  return /[？?]/.test(paragraph);
}

function countKeywordHits(text: string, keywords: string[]): number {
  let hits = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) hits++;
  }
  return hits;
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

export function analyzeCliffhanger(text: string): CliffhangerFeatures {
  if (!text || text.trim().length === 0) {
    return {
      endingType: "flat",
      hasQuestion: false,
      hasReversalHint: false,
      suspenseHitCount: 0,
    };
  }

  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) {
    return {
      endingType: "flat",
      hasQuestion: false,
      hasReversalHint: false,
      suspenseHitCount: 0,
    };
  }

  // Analyze last 5 paragraphs (or fewer if short)
  const endingParas = paragraphs.slice(-Math.min(5, paragraphs.length));
  const endingText = endingParas.join("\n");
  const lastParagraph = endingParas[endingParas.length - 1];

  const suspenseHits = countKeywordHits(endingText, SUSPENSE_KEYWORDS);
  const hasReversal = hasAnyKeyword(endingText, REVERSAL_HINT_KEYWORDS);
  const hasUnresolvedConflict = hasAnyKeyword(endingText, UNRESOLVED_CONFLICT_KEYWORDS);
  const hasResolution = hasAnyKeyword(endingText, RESOLUTION_MARKERS);
  const hasEmotion = hasAnyKeyword(endingText, EMOTION_HOOK_KEYWORDS);
  const endsWithQuestion = hasQuestion(lastParagraph);

  // Determine ending type
  let endingType: CliffhangerFeatures["endingType"];
  if (endsWithQuestion) {
    endingType = "question";
  } else if (hasReversal) {
    endingType = "reversal";
  } else if (hasUnresolvedConflict && !hasResolution) {
    endingType = "action";
  } else if (hasEmotion && suspenseHits > 0) {
    endingType = "emotional";
  } else if (suspenseHits > 0) {
    endingType = "suspense";
  } else {
    endingType = "flat";
  }

  return {
    endingType,
    hasQuestion: endsWithQuestion,
    hasReversalHint: hasReversal,
    suspenseHitCount: suspenseHits,
  };
}
