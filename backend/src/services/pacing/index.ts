export interface PacingCurvePoint {
  paragraph: number;
  tension: number;
  type: "action" | "dialogue" | "description";
}

export interface PacingResult {
  score: number;
  curve: PacingCurvePoint[];
  cv: number;
  typeRatio: { action: number; dialogue: number; description: number };
}

const ACTION_KEYWORDS = [
  "拔出", "劈", "砍", "刺", "打", "踢", "冲", "杀", "攻击", "闪避",
  "出击", "大喝", "怒吼", "挥拳", "踢出", "斩", "射", "挡", "闪",
  "猛地", "全力", "暴起", "飞身", "扑", "跃", "跳",
];

// 中文网文常见引号：ASCII 直双引号 "、弯双引号 " "、直单引号 '、弯单引号 ' '、
// 日式引号 「 」 『 』
const QUOTE_CHARS = /["“”‘’「」『』]/;

function classifyParagraph(text: string): "action" | "dialogue" | "description" {
  const trimmed = text.trim();

  if (QUOTE_CHARS.test(trimmed)) return "dialogue";

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

function downsampleCurve(curve: PacingCurvePoint[]): PacingCurvePoint[] {
  const n = curve.length;
  if (n <= 30) return curve;
  // Keep first and last points to preserve full range
  const step = n > 60 ? 3 : 2;
  const sampled: PacingCurvePoint[] = [];
  for (let i = 0; i < n; i += step) {
    sampled.push(curve[i]);
  }
  // Always include the last point if not already included
  const lastIncluded = sampled[sampled.length - 1];
  if (lastIncluded.paragraph !== curve[n - 1].paragraph) {
    sampled.push(curve[n - 1]);
  }
  return sampled;
}

export function analyzePacing(text: string): PacingResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, curve: [], cv: 0, typeRatio: { action: 0, dialogue: 0, description: 0 } };
  }

  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) {
    return { score: 0, curve: [], cv: 0, typeRatio: { action: 0, dialogue: 0, description: 0 } };
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

  const counts = { action: 0, dialogue: 0, description: 0 };
  for (const p of curve) counts[p.type]++;
  const total = curve.length;
  const typeRatio = {
    action: Math.round((counts.action / total) * 100) / 100,
    dialogue: Math.round((counts.dialogue / total) * 100) / 100,
    description: Math.round((counts.description / total) * 100) / 100,
  };

  return { score, curve: downsampleCurve(curve), cv: Math.round(cv * 100) / 100, typeRatio };
}
