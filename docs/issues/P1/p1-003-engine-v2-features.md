# Issue #p1-003: 规则引擎 v2 — 从评分者到特征提取器

## Parent

[PRD: P1 规则引擎 v2 重构](../../prd/PRD-P1-规则引擎v2重构.md) — 模块 T1

## What to build

将 5 个规则引擎（climax/pacing/filler/hook/cliffhanger）从"评分者"转型为"特征提取器"：保留所有检测逻辑，移除评分公式，输出结构化特征数据作为 LLM prompt 上下文。

**核心变更：**
- 类型重命名：`ClimaxResult` → `ClimaxFeatures`（同理 Pacing/Filler/Hook/Cliffhanger）
- 所有 `score` 字段移除
- 保留全部检测逻辑：关键词匹配、段落分类、张力计算、相似度检测、开头/结尾类型判定
- 各引擎保持独立（不使用共享工具模块）

**各引擎输出特征：**

| 引擎 | 保留的特征字段 |
|------|-------------|
| ClimaxFeatures | `matchedKeywords`, `keywordCategories` (reversal/shock/breakthrough/conflict/emotion), `dialogueDensity`, `conflictDensity` |
| PacingFeatures | `curve` (PacingCurvePoint[]), `cv`, `typeRatio` (action/dialogue/description), `paragraphCount` |
| FillerFeatures | `items` (FillerItem[]), `suspiciousPairs` (SuspiciousPair[]) — 注意：此引擎当前已无 score，仅需重命名类型 |
| HookFeatures | `openingType` (conflict/suspense/dialogue/description/mixed), `hasQuestion`, `hasGoldenLine`, `conflictHitCount`, `suspenseHitCount` |
| CliffhangerFeatures | `endingType` (suspense/question/emotional/reversal/action/flat), `hasQuestion`, `hasReversalHint`, `suspenseHitCount` |

**同步更新：** 所有导入这些类型的依赖文件（pipeline、guard、API 路由等约 11 个文件）。

## Acceptance criteria

- [x] 5 个引擎的类型从 `*Result` 重命名为 `*Features`
- [x] 所有 `score: number` 字段移除
- [x] 所有评分公式（如 `keywordScore * 0.5 + dialogueBonus * 0.2 + conflictBonus * 0.3`）移除
- [x] 检测逻辑完整保留（关键词匹配、段落分类、张力计算等）
- [x] 所有依赖文件（约 11 个）的类型引用更新
- [x] 引擎测试就地改写：旧 score 断言移除，新增特征字段断言（如 `expect(result.matchedKeywords).toContain(...)`）
- [x] 后端测试通过（210 个，超出预期）
- [x] 已有前端 131 个测试无回归

## Blocked by

None — can start immediately.
