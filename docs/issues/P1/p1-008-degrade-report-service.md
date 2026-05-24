# Issue #p1-008: Degrade-Report 独立服务 — 模板 NLG

## Parent

[PRD: P1 规则引擎 v2 重构](../../prd/PRD-P1-规则引擎v2重构.md) — 模块 T8

## What to build

新建 `backend/src/services/degrade-report/index.ts`，当双模型同时失败时，基于规则引擎特征（来自 p1-003）自动生成中文定性报告。这是双模型失败时的降级路径，也是纯模板 NLG 之上的最后一层有意义的输出。

**核心功能：**

1. **5 引擎 Feature → 中文定性报告**：接收 p1-003 产出的 5 个 `*Features` 对象，生成结构化中文叙述
2. **4 维度分节描述**：Hook（开头类型 + 冲突/悬念密度）、爽点（关键词类别分布）、悬念（结尾类型 + 反转暗示）、节奏（类型比 + CV 值），每节 2-4 句定性描述
3. **顶部总结句**：1-2 句总览，如"本章以冲突型开头，对话密度较高，章末留有悬念"
4. **Severity heuristics**：根据特征严重度调整措辞（如 conflictHitCount > 5 → "冲突密集"，1-2 → "冲突较少"）
5. **独立测试覆盖**：不依赖 LLM，纯模板逻辑可完全测试

## Acceptance criteria

- [x] `generateDegradeReport(features: AllFeatures): string` 接受 5 个 Features 对象
- [x] 输出包含 4 维度分节（Hook/爽点/悬念/节奏）+ 顶部总结句
- [x] Severity heuristics 对关键指标有至少 3 档措辞（高/中/低）
- [x] 所有模板使用中文
- [x] 不抛出异常（输入为空 Features 时返回兜底文本）
- [x] 独立测试覆盖：正常输入 5 引擎 Feature、空 Feature、部分缺失 Feature（约 10 个测试）
- [x] 服务不依赖 LLM 调用，纯模板逻辑

## Blocked by

None — can start immediately（仅依赖 p1-003 的类型定义，可在 p1-003 完成后立即开发，与 p1-004~p1-006 并行）。
