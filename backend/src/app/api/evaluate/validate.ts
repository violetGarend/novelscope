export interface ValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
  };
}

const MIN_LENGTH = 1000;
const MAX_LENGTH = 50000;
const CHINESE_RATIO_THRESHOLD = 0.3;

function isMainlyChinese(text: string): boolean {
  const chineseChars = text.match(/[一-鿿]/g);
  const ratio = chineseChars ? chineseChars.length / text.length : 0;
  return ratio >= CHINESE_RATIO_THRESHOLD;
}

export function validateChapterText(text: string | null | undefined): ValidationResult {
  if (text === null || text === undefined || text.trim().length === 0) {
    return {
      valid: false,
      error: { code: "VALIDATION_ERROR", message: "请输入章节文本" },
    };
  }

  if (text.length < MIN_LENGTH) {
    return {
      valid: false,
      error: { code: "VALIDATION_ERROR", message: `文本不足${MIN_LENGTH}字，无法评估。建议至少1000字。` },
    };
  }

  if (text.length > MAX_LENGTH) {
    return {
      valid: false,
      error: { code: "VALIDATION_ERROR", message: "文本过长，请分段提交" },
    };
  }

  if (!isMainlyChinese(text)) {
    return {
      valid: false,
      error: { code: "VALIDATION_ERROR", message: "目前仅支持中文网文" },
    };
  }

  return { valid: true };
}
