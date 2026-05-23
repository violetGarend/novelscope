# Issue #p1-005: 校准 CLI + Prompt v2 验证（P1 Gate）

## Parent

[PRD: P1 规则引擎 v2 重构](../../prd/PRD-P1-规则引擎v2重构.md) — 模块 T6

## What to build

新建 `backend/scripts/calibrate.ts` CLI runner，验证 Prompt v2 + DeepSeek 的评分方差是否充足。**这是 P1 Gate：验证通过后才启动 p1-006 双模型。**

**核心功能：**

1. **Golden Sample 测试**：使用 5 个已有 Golden Sample（来自 Issue #12），每个跑 3 轮评估
2. **方差检查**：每个 sample 的 3 轮评分方差 < 0.5
3. **命中率检查**：≥ 4/5 样本命中预期评分范围（与 Golden Sample 标注对比）
4. **自动生成验证报告**：JSON 格式输出到 `backend/calibration-results/`，包含每样本每轮分数、方差、是否命中
5. **GATE 逻辑**：
   - 通过 → 输出 "PASS — 可以启动 p1-006 双模型"
   - 不通过 → 输出 "FAIL — 需调优 Prompt v2 锚点/措辞后重新校准"

## Acceptance criteria

- [ ] `npx tsx backend/scripts/calibrate.ts` 可执行
- [ ] 5 样本 × 3 轮 = 15 次评估，全部完成或明确失败
- [ ] 方差计算正确（每个 sample 3 轮 4 维度的 pooled variance）
- [ ] 命中范围判断逻辑正确（与 Golden Sample 标注对比，容差 ±1.5）
- [ ] 验证报告 JSON 包含：样本 ID、每轮分数、方差、命中状态、整体 PASS/FAIL
- [ ] Gate 通过标准：方差 < 0.5 且 ≥ 4/5 样本命中
- [ ] 不通过时有清晰的调优建议输出
- [ ] CLI 测试覆盖（约 5 个测试：方差计算、命中判断、报告生成、PASS/FAIL 逻辑）

## Blocked by

- p1-004（依赖 Prompt v2 的 `buildEvaluationPrompt()`）
