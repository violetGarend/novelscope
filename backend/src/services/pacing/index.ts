export interface PacingCurvePoint {
  paragraph: number;
  tension: number;
  type: "action" | "dialogue" | "description";
}

export interface PacingResult {
  score: number;
  curve: PacingCurvePoint[];
}

const ACTION_KEYWORDS = [
  "拔出", "劈", "砍", "刺", "打", "踢", "冲", "杀", "攻击", "闪避",
  "出击", "大喝", "怒吼", "挥拳", "踢出", "斩", "射", "挡", "闪",
  "猛地", "全力", "暴起", "飞身", "扑", "跃", "跳",
];

const DIALOGUE_PATTERN = /[「」""''「」]|^[""].*[""]$/;

function classifyParagraph(text: string): "action" | "dialogue" | "description" {
  const trimmed = text.trim();
  if (DIALOGUE_PATTERN.test(trimmed)) return "dialogue";
  const actionHits = ACTION_KEYWORDS.filter((kw) => trimmed.includes(kw)).length;
  if (actionHits >= 2) return "action";
  return "description";
}

function calculateTension(type: "action" | "dialogue" | "description", text: string): number {
  const base = type === "action" ? 7 : type === "dialogue" ? 5 : 3;
  const actionBoost = ACTION_KEYWORDS.filter((kw) => text.includes(kw)).length * 0.5;
  return Math.min(10, Math.max(0, base + actionBoost));
}

function calculateCV(lengths: number[]): number {
  if (lengths.length < 2) return 0;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 0;
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  return Math.sqrt(variance) / mean;
}

function calculateRatioScore(curve: PacingCurvePoint[]): number {
  const total = curve.length;
  if (total === 0) return 0;
  const counts = { action: 0, dialogue: 0, description: 0 };
  for (const p of curve) counts[p.type]++;
  // Ideal ratio: roughly balanced, not dominated by one type
  const ratios = [counts.action / total, counts.dialogue / total, counts.description / total];
  const entropy = ratios.reduce((sum, r) => (r > 0 ? sum - r * Math.log2(r) : sum), 0);
  // Max entropy for 3 types is log2(3) ≈ 1.585
  return (entropy / Math.log2(3)) * 10;
}

export function analyzePacing(text: string): PacingResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, curve: [] };
  }

  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) {
    return { score: 0, curve: [] };
  }

  const curve: PacingCurvePoint[] = paragraphs.map((p, i) => {
    const type = classifyParagraph(p);
    const tension = calculateTension(type, p);
    return { paragraph: i + 1, tension: Math.round(tension * 10) / 10, type };
  });

  const lengths = paragraphs.map((p) => p.length);
  const cv = calculateCV(lengths);
  const ratioScore = calculateRatioScore(curve);

  // CV score: higher CV = more varied pacing = better (cap at 1.0)
  const cvScore = Math.min(10, cv * 10);

  const rawScore = cvScore * 0.4 + ratioScore * 0.6;
  const score = Math.round(Math.min(10, Math.max(0, rawScore)) * 10) / 10;

  return { score, curve };
}
