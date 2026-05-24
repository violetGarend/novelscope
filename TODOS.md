# TODOS

## 分类 prompt 锚点校准

- **加入日期:** 2026-05-24
- **来源:** /plan-eng-review — LLM 段落分类介入节奏曲线
- **What:** 分类 prompt 中的 6 种类型锚点定义（action/dialogue/description/inner_monologue/epic/transition）需要在 5 个 golden sample 上跑分类，对比人工标注 ground truth，迭代优化锚点措辞和 few-shot examples。
- **Why:** 初次上线的锚点定义是初版设计，未经验证。锚点措辞直接影响 LLM 分类准确率——措辞偏差会导致系统性误分类（如"内心独白"和"对话"的边界模糊）。
- **Pros:** 提升分类准确率，减少上线后用户投诉"分类不准"的概率。
- **Cons:** 需要人工标注 5×50=250 段（约 2-3 小时），外加 1-2 轮 prompt 迭代。
- **Context:** 分类 prompt 在 `backend/src/services/classify/prompt.ts`。Golden samples 在 `backend/src/services/golden-sample/`。
- **Depends on / blocked by:** LLM 段落分类功能实现完成后。

## 分类差异率追踪

- **加入日期:** 2026-05-24
- **来源:** /plan-eng-review — LLM 段落分类介入节奏曲线
- **What:** 在 PacingFeatures 或 pipeline metadata 中增加 `llmRuleDiffRate: number` 字段，记录每章 LLM 分类与规则引擎分类的差异段落比例。数据积累后可分析：哪些章节类型 LLM 分类收益最大？什么时候规则引擎已够用？
- **Why:** 没有量化数据就无法判断 LLM 分类的实际增量价值。差异率是判断"这功能值不值得继续维护"的核心指标。
- **Pros:** 实现成本极低（后端加一个计数，前端已有的 features 数据），持续积累决策依据。
- **Cons:** 几乎为零——一个数字字段。
- **Context:** 在 `analyzePacingWithTypes` 中对比 LLM types 和 baseline classifyParagraphs 的结果即可算出。
- **Depends on / blocked by:** LLM 段落分类功能实现完成后。

## Embedding 本地分类替代方案

- **加入日期:** 2026-05-24
- **来源:** /plan-eng-review — LLM 段落分类介入节奏曲线
- **What:** 积累足够 LLM 分类数据（估计 500+ 段人工校验后）后，用 BGE-large-zh 向量化段落，与 6 种类型的原型向量做余弦相似度匹配，替代 API 调用。路线 1（LLM）积累标注数据 → 路线 2（Embedding）本地化是自然的进化路径。
- **Why:** 消除分类步骤对网络/API 的依赖，降低延迟（200-500ms vs 3-5s），零 token 成本。对于高频使用场景（作者每章迭代评估），本地化有明显体验提升。
- **Pros:** 完全本地、零 token 成本、确定性输出（同段永远同分类）、可作为规则引擎改进的 benchmark。
- **Cons:** 需要人工校验的生产数据积累（至少 500 段），前期投入较大；Embedding 对网文特有类型（系统提示、装逼打脸）的区分能力需要验证。
- **Context:** BGE-large-zh 已在项目技术栈中。原型文本从 LLM 分类结果中选取高置信度代表段落。
- **Depends on / blocked by:** LLM 段落分类上线 + 差异率追踪数据积累。
