# Issue #p1-007: Guard 扩展 — 分歧检测

## Parent

[PRD: P1 规则引擎 v2 重构](../../prd/PRD-P1-规则引擎v2重构.md) — 模块 T4

## What to build

在现有 guard 服务（clamp/variance 校验）基础上新增双模型分歧检测能力。

**核心功能：**

1. **`detectDivergence(scoresA, scoresB)`** — 比较 DeepSeek 和 豆包 的 4 维度分数，任一维度差异 > 2 分时标记为 divergence
2. **DivergenceReport 输出**：列出分歧维度、双方分数、差值（delta）
3. **日志记录**：分歧事件记录维度、分数差、模型信息，便于后续分析评分质量
4. **边界值处理**：严格 > 2 触发（恰好 2.0 不标记为分歧）
5. **模块分离**：与现有 clamp/variance 保持独立，不混入现有 guard 模块

## Acceptance criteria

- [x] `detectDivergence(deepseekScores, doubaoScores)` 返回 `DivergenceReport | null`
- [x] 任一维度差值 > 2 时标记为分歧（如 hook: 6 vs 3.5, delta=2.5 → 标记）
- [x] 差值恰好 2.0 时不标记（边界值：hook: 6 vs 4, delta=2.0 → 不标记）
- [x] 分歧报告包含：维度名、DeepSeek 分数、豆包 分数、delta
- [x] 分歧事件写日志（console.warn 或 logger）
- [x] 与现有 guard（clamp/variance）模块分离，不相互依赖
- [x] 测试覆盖：全部一致、单维度分歧、多维度分歧、边界值 2.0、零差值（约 8 个测试）
- [x] 已有 guard 测试无回归

## Blocked by

- p1-006（依赖 DualModelScores 类型和双模型编排）
