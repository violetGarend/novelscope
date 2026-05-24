# Issue #p1-027: LLM 段落分类介入节奏曲线

## Parent

[PRD: LLM 段落分类介入节奏曲线](../../prd/PRD-P1-LLM段落分类节奏曲线.md)

## What to build

将 pacing 段落分类从纯规则引擎（3 种类型）升级为 LLM 分类（5 种基础类型 + isEpic 强度标记），提升节奏曲线的信息密度和分类准确率。

**核心变更：**

1. **段落分类服务** (`classify/`)：分类 prompt 构建、Zod schema（逐标签容错）、`classifyParagraphs(text, llmClient)` 函数。模型：doubao-seed-2-0-mini-260428
2. **Pacing 引擎扩展**：新增 `analyzePacingWithTypes(text, types)`——接收外部 5+1 类型，用扩展 base tension 映射表重新计算张力。原函数不变
3. **Orchestrator 集成**：Step 5 加第三个 `Promise.allSettled`（分类与双模型评估并行）。逐标签容错——非法标签用 baseline 替代，不影响其他标签
4. **类型体系**：5 种基础类型（action/dialogue/description/inner_monologue/transition）+ isEpic: boolean。Epic 不是独立类型而是强度修饰
5. **前端 PacingCurve**：5 种颜色 + epic 视觉增强（边框加粗/星标），5 项图例可 toggle，tooltip 显示新类型 + isEpic
6. **降级路径**：分类调用失败/超时 → 回退规则引擎 3 种类型（用户无感知）

**类型 × base tension 映射：**

| 基础类型 | base | +isEpic |
|---|---|---|
| action | 7 | 8 |
| dialogue | 5 | 6 |
| description | 3 | 5 |
| inner_monologue | 4 | 5 |
| transition | 2 | 3 |

## Acceptance criteria

- [ ] `classify/` 模块：prompt 构建 + Zod schema（逐标签容错）+ `classifyParagraphs` 函数
- [ ] `analyzePacingWithTypes` 函数：接收外部类型 → 正确 base tension + keyword boost
- [ ] 原 `analyzePacing` 函数行为不变（回归测试全部通过）
- [ ] Orchestrator Step 5 并行三调用（双评估 + 分类），Step 6 合并结果
- [ ] 分类成功 → curve 使用 LLM 5+1 类型
- [ ] 分类失败 → curve 使用规则引擎 3 种类型（用户无感知）
- [ ] 逐标签容错：200 标签中 1 个非法 → 只影响该段，其余 199 段正常
- [ ] 前端 PacingCurve 渲染 5 种颜色 + epic 标记，图例 5 项可 toggle
- [ ] 后端单测：classify（6）+ pacing（8）+ orchestrator（4）= 18
- [ ] 前端单测：PacingCurve 扩展（6）
- [ ] Eval：golden sample 分类准确率 > 规则引擎 baseline
- [ ] Eval：同一章节两次分类一致性 > 90%

## Blocked by

- p1-006（依赖双模型编排基础设施）
- p1-010（依赖前端 V2 adaptation）
