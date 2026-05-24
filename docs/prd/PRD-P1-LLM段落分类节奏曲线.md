# PRD: LLM 段落分类介入节奏曲线

## Problem Statement

当前 pacing 规则引擎用关键词计数做段落分类（action/dialogue/description 3 种）。分类逻辑是 1990 年代的 NLP 水平——靠引号检测对话、靠动作关键词计数区分动作和描写。在真实网文场景中存在三类系统性问题：

1. **分类粗糙**：内心独白（"难道……他真的背叛了我？"）被误判为对话（因为有引号）；史诗场面（"九天之上，雷霆万钧。十万天兵列阵"）和日常描写被归为同一类 description（tension=3）
2. **无语境感知**：不知道这段是在铺垫还是高潮。一段 description 在开头（世界观介绍）vs 在高潮后（情绪余韵）的意义完全不同，但得到相同的 tension=3
3. **网文特有类型缺失**：系统提示面板、装逼打脸名场面、情绪爆发段——这些在网文中高频出现的段落类型完全没有对应的分类标签

作者看到节奏曲线时，三条线（动作/对话/描写）提供的信息密度不够——无法区分"这是关键高潮"和"这是一般打斗"，也无法看出情绪起伏的结构。

## Solution

新增一次独立的 LLM 段落分类调用（doubao-seed-2-0-mini-260428），与双模型评估并行执行。LLM 将每段归类为 5 种基础类型之一，并标记是否为史诗/高潮场景（isEpic）。规则引擎使用 LLM 输出的类型重新计算张力，生成最终曲线。

段落类型从 3 种扩展到 5 种基础类型 + 1 个强度标记：

| 类型 | base tension | +isEpic |
|---|---|---|
| action（战斗/动作） | 7 | 8 |
| dialogue（人物对话） | 5 | 6 |
| description（场景/环境） | 3 | 5 |
| inner_monologue（内心独白） | 4 | 5 |
| transition（过渡/系统/信息） | 2 | 3 |

Tension 公式复用规则引擎（base + actionKeywords × 0.5），LLM 不直接输出数字，只输出类型标签。

**降级策略：** 分类调用失败或超时 → 回退到规则引擎的 3 种类型。用户无感知——曲线始终存在，区别只在 3 色 vs 5+1 色。

**容错策略：** 逐标签 sanitize。200 个标签中 1 个拼错，只影响该段（用规则引擎分类替代），不影响其他 199 段。

## User Stories

1. 作为一个网文作者，我希望评估系统能准确区分我的"内心独白"段落和"对话"段落，这样节奏曲线能反映真实的情感起伏
2. 作为一个网文作者，我希望章节中的史诗场面/情绪爆发能被识别为高张力节点，而不是被归类为普通描写（tension=3）
3. 作为一个网文作者，我希望看到更丰富的节奏曲线——不止 3 条线，而是能区分不同类型的叙事单元
4. 作为一个网文作者，我希望节奏曲线上的高光时刻（epic 标记）有视觉上的区分（加粗/星标），一眼就能看到高潮在哪里
5. 作为一个网文作者，我希望图例告诉我每种颜色代表什么类型，并且可以独立开关每条线
6. 作为一个网文作者，当 AI 分类出错时，我希望曲线仍然可用（回退到基础版本），而不是白屏或报错
7. 作为一个产品使用者，我不希望因为新增了分类功能而显著增加评估等待时间
8. 作为一个开发者，我希望分类模块有独立的测试覆盖，新增类型的 tension 计算有确定的预期值

## Implementation Decisions

### 新增模块：段落分类服务

独立模块负责构建分类 prompt、调用 LLM、校验和 sanitize 输出。Prompt 包含 5 种基础类型 + isEpic 的锚点定义（含网文特定场景描述）。Zod schema 做逐标签校验——非法标签用该段的规则引擎分类替代，不整批丢弃。

### Pacing 引擎扩展

新增 `analyzePacingWithTypes(text, types)` 函数，接收外部分类结果（5 种基础类型 + isEpic 标记），用扩展后的 base tension 映射表重新计算张力。原 `analyzePacing` 函数不变，保持向后兼容。

### orchestrator 集成

在 Step 5（双模型评估）中以第三个 `Promise.allSettled` 调用并行执行分类。分类在 `evaluateWithTruncationLoop` 外部——分类 prompt 短、输出简单，不需要截断/重试逻辑。Step 6 合并结果：分类成功 → 用 LLM types；分类失败 → 用 baseline 规则引擎 types。

### 评估 prompt 保持不变

双模型评估 prompt 继续使用规则引擎的 3 种类型统计特征（CV、类型比例、平均张力）。pacingScore 和曲线来自不同的分类体系——这是一个有意识的不一致选择，用并行执行换取零额外延迟。

### 分类模型

使用 doubao-seed-2-0-mini-260428（豆包 mini 轻量版）。分类是简单的标签输出任务，不需要强模型。Mini 版延迟低、成本低，适合高频调用。

### 全量段落分类

不降采样——分类前将全部段落（≤200）发送给 LLM。保留完整上下文让 LLM 看到段落间的起承转合。200 段时输入约 10K-20K tokens，输出约 2K-3K tokens。

### 前端 PacingCurve 扩展

从 3 种类型扩展到 5 种基础类型。Epic 标记用视觉增强（边框加粗或星标），不独立成颜色。图例显示 5 项，每项可 toggle。Tooltip 显示段落类型 + isEpic 标记。

## Testing Decisions

### 测试原则
- 单测覆盖所有代码路径：schema 校验、类型映射、降级逻辑、前端渲染
- 分类调用使用 mock LLM client（沿袭 client.test.ts 的 mock 模式）
- Eval 测试覆盖分类 prompt 在 golden sample 上的准确率和一致性

### 测试模块
- classify/（6 单测）：schema 校验（合法/非法/非数组）、prompt 生成、分类函数（成功/失败/数量不匹配）
- pacing/（8 单测）：analyzePacingWithTypes（6 种类型全覆盖、空 types 回退、数量不匹配截断/填充、tension 正确计算、CV 不变、降采样不变）+ 回归（原 analyzePacing 行为不变）
- orchestrator（4 单测）：三调用全成功、分类失败回退、分类成功+一个模型失败、双双失败
- PacingCurve（6 单测）：5 项图例、5 种颜色、epic 标记渲染、toggle 交互、新类型 tooltip、空数据

### 参考测试
- `backend/src/services/pacing/pacing.test.ts`（10 个测试，分析模式）
- `backend/src/services/pipeline/orchestrator.test.ts`（18 个测试，mock DI 模式）
- `frontend/src/components/PacingCurve.test.tsx`（25 个测试，渲染+交互模式）

## Out of Scope

- LLM 逐段调整 tension 数值（不可靠——LLM 出标签稳定，出数字不稳定）
- LLM 生成理想曲线参照（过度工程化）
- Embedding 本地分类替代（已加入 TODOS.md，积累数据后再评估）
- 删除规则引擎分类（保留作为兜底）
- 分类结果缓存（月均 300 次调用，成本可忽略）
- 分类结果喂给评估 prompt（选择并行执行，接受弱不一致）

## Further Notes

- 本次改动源于 `/plan-eng-review` 对"节奏曲线需要 LLM 介入"的完整工程审查
- 外部审查（outside voice）发现 3 个关键问题并已解决：架构矛盾（保持并行）、Zod 全量回退（改为逐标签容错）、epic 类型互斥（改为 isEpic 强度标记）
- 3 个 TODO 已写入 TODOS.md：分类 prompt 锚点校准、分类差异率追踪、Embedding 替代方案
- Test plan artifact: `~/.gstack/projects/AI/Administrator-dev-eng-review-test-plan-20260524-175115.md`
