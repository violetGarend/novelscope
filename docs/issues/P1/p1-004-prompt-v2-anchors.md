# Issue #p1-004: Prompt v2 — 6 锚点评分 + 特征注入 + 软化分布引导

## Parent

[PRD: P1 规则引擎 v2 重构](../../prd/PRD-P1-规则引擎v2重构.md) — 模块 T2

## What to build

完整重写 `backend/src/services/prompt/index.ts`，用 6 锚点评分体系替换当前模糊的评分指令，并将 p1-003 产出的结构化特征注入 prompt。

**核心变更：**

1. **6 锚点评分**：每维度（hook/climax/cliffhanger/pacing）定义 0/2/4/6/8/10 六个级别，每个级别附带具体中文网文示例文本，让 LLM 有明确参照系
2. **XML 标签分隔**：用 `<features>`, `<anchors>`, `<instruction>` 等 XML 标签清晰分隔各维度特征和锚点参考，降低 LLM 混淆
3. **软化分布措辞**：使用"请充分利用 0-10 全量程，除非有明确理由集中在中部"，替代强制的"必须区分"，保持评分诚实性
4. **特征截断检测**：`buildEvaluationPrompt()` 返回 `needsTruncation: boolean` 和 `truncatedFeatures`，当特征总量超过上下文窗口时标记，由 pipeline 层协调 LLM 摘要压缩循环
5. **Prompt 服务保持纯函数**：截断协调逻辑在 pipeline 层，prompt 服务只负责构建和检测
6. **可选 v1 fallback**：通过配置开关保留 v1 prompt，便于 AB 对比

## Acceptance criteria

- [x] `buildEvaluationPrompt()` 接受 p1-003 的 Features 类型作为输入
- [x] 产出的 prompt 包含 4 维度 × 6 锚点（24 个锚点示例），全部为中文网文风格
- [x] prompt 使用 XML 标签结构分隔各区域
- [x] 返回值包含 `needsTruncation: boolean` 和 `truncatedFeatures` 字段
- [x] 软化措辞替代强制分布指令
- [x] 现有 6 个 prompt 测试替换为 41 个新测试（锚点内容、特征注入、截断检测、软化措辞、v1 fallback）
- [x] 后端测试全部通过（210 个）
- [x] 可选：v1 prompt 通过配置开关保留

## Blocked by

- p1-003（依赖 `*Features` 类型定义）
