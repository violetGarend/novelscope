export interface FillerItem {
  paragraph: number;
  reason: string;
  suggestion: string;
}

export interface FillerResult {
  items: FillerItem[];
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.includes(shorter)) return shorter.length / longer.length;

  // Simple bigram overlap
  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.substring(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.substring(i, i + 2));

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

export function detectFiller(text: string): FillerResult {
  if (!text || text.trim().length === 0) {
    return { items: [] };
  }

  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length < 2) {
    return { items: [] };
  }

  const items: FillerItem[] = [];
  const SIMILARITY_THRESHOLD = 0.7;

  for (let i = 0; i < paragraphs.length; i++) {
    for (let j = i + 1; j < paragraphs.length; j++) {
      const sim = similarity(paragraphs[i], paragraphs[j]);
      if (sim >= SIMILARITY_THRESHOLD) {
        items.push({
          paragraph: i + 1,
          reason: `第${i + 1}段与第${j + 1}段内容高度相似（${Math.round(sim * 100)}%）`,
          suggestion: "建议合并或删除重复段落，避免注水嫌疑",
        });
        break; // One report per paragraph is enough
      }
    }
  }

  return { items };
}
