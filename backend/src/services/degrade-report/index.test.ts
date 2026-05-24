import { describe, it, expect } from "@jest/globals";
import { generateDegradeReport } from "./index";
import type { AllFeatures } from "../pipeline/types";
import type { ClimaxFeatures } from "../climax";
import type { PacingFeatures } from "../pacing";
import type { FillerFeatures } from "../filler";
import type { HookFeatures } from "../hook";
import type { CliffhangerFeatures } from "../cliffhanger";

// ── Mock feature factories ──

function mockFeatures(overrides?: Partial<{
  climax: Partial<ClimaxFeatures>;
  pacing: Partial<PacingFeatures>;
  filler: Partial<FillerFeatures>;
  hook: Partial<HookFeatures>;
  cliffhanger: Partial<CliffhangerFeatures>;
}>): AllFeatures {
  return {
    climax: {
      matchedKeywords: [],
      keywordCategories: { reversal: [], shock: [], breakthrough: [], conflict: [], emotion: [] },
      dialogueDensity: 0.3,
      conflictDensity: 0.3,
      ...overrides?.climax,
    },
    pacing: {
      curve: [],
      cv: 0.4,
      typeRatio: { action: 0.33, dialogue: 0.33, description: 0.34 },
      ...overrides?.pacing,
    },
    filler: {
      items: [],
      suspiciousPairs: [],
      ...overrides?.filler,
    },
    hook: {
      openingType: "description",
      hasQuestion: false,
      hasGoldenLine: false,
      conflictHitCount: 2,
      suspenseHitCount: 2,
      ...overrides?.hook,
    },
    cliffhanger: {
      endingType: "flat",
      hasQuestion: false,
      hasReversalHint: false,
      suspenseHitCount: 2,
      ...overrides?.cliffhanger,
    },
  };
}

// ── Tests ──

describe("generateDegradeReport", () => {
  it("returns a non-empty Chinese string", () => {
    const features = mockFeatures();
    const report = generateDegradeReport(features);
    expect(typeof report).toBe("string");
    expect(report.length).toBeGreaterThan(50);
    expect(/[一-鿿]/.test(report)).toBe(true);
  });

  it("contains all 4 dimension sections", () => {
    const features = mockFeatures();
    const report = generateDegradeReport(features);
    expect(report).toContain("开头分析");
    expect(report).toContain("爽点分析");
    expect(report).toContain("章末悬念");
    expect(report).toContain("节奏分析");
  });

  it("includes reason parameter in output", () => {
    const features = mockFeatures();
    const report = generateDegradeReport(features, "双模型超时");
    expect(report).toContain("双模型超时");
  });

  it("uses high severity wording for dense conflict", () => {
    const features = mockFeatures({ hook: { conflictHitCount: 8 } });
    const report = generateDegradeReport(features);
    expect(report).toContain("密集");
  });

  it("uses low severity wording for sparse conflict", () => {
    const features = mockFeatures({ hook: { conflictHitCount: 0, suspenseHitCount: 0 } });
    const report = generateDegradeReport(features);
    expect(report).toContain("较少");
  });

  it("uses mid severity wording at tier boundary", () => {
    const features = mockFeatures({ hook: { conflictHitCount: 3, suspenseHitCount: 3 } });
    const report = generateDegradeReport(features);
    expect(report).toContain("适中");
  });

  it("handles all-empty / minimal features gracefully", () => {
    const features = mockFeatures({
      hook: { conflictHitCount: 0, suspenseHitCount: 0, hasQuestion: false, hasGoldenLine: false, openingType: "description" },
      climax: { matchedKeywords: [], dialogueDensity: 0, conflictDensity: 0 },
      cliffhanger: { endingType: "flat", suspenseHitCount: 0, hasQuestion: false, hasReversalHint: false },
      pacing: { curve: [], cv: 0, typeRatio: { action: 0, dialogue: 0, description: 0 } },
      filler: { items: [], suspiciousPairs: [] },
    });
    const report = generateDegradeReport(features);
    // Should not throw, should return a string
    expect(typeof report).toBe("string");
    expect(report.length).toBeGreaterThan(0);
  });

  it("mentions golden line when present", () => {
    const features = mockFeatures({ hook: { hasGoldenLine: true } });
    const report = generateDegradeReport(features);
    expect(report).toContain("金句");
  });

  it("mentions reversal hint when present", () => {
    const features = mockFeatures({ cliffhanger: { hasReversalHint: true } });
    const report = generateDegradeReport(features);
    expect(report).toContain("反转");
  });

  it("reports no filler detected when empty", () => {
    const features = mockFeatures({ filler: { items: [], suspiciousPairs: [] } });
    const report = generateDegradeReport(features);
    expect(report).toContain("未检测到明显注水");
  });

  it("warns about weak cliffhanger when applicable", () => {
    const features = mockFeatures({
      cliffhanger: { endingType: "flat", suspenseHitCount: 0, hasQuestion: false, hasReversalHint: false },
    });
    const report = generateDegradeReport(features);
    expect(report).toContain("追读率");
  });

  it("includes footer disclaimer", () => {
    const features = mockFeatures();
    const report = generateDegradeReport(features);
    expect(report).toContain("AI 深度评估暂时不可用");
  });
});
