# PRD: P0 追读力评估原型

## Problem Statement

中文网文作者每天产出 5000-10000 字，但缺乏数据化的质量反馈。他们不知道自己的"钩子"是否够强、爽点密度是否足够、章末悬念能否留住读者。现有工具（橙瓜、墨者）侧重排版和投稿，不提供内容质量分析。作者需要一个能粘贴章节、即时获得结构化质量报告的工具，帮助他们在日更压力下持续提升作品追读力。

## Solution

构建一个本地可运行的追读力评估原型。作者粘贴一章文本，系统通过规则引擎（本地计算）提取结构化信号，将信号注入 LLM prompt，由 LLM（DeepSeek API）基于信号+原文进行最终评分，输出包含综合评分、爽点密度、Hook 强度、章末悬念、节奏曲线、注水检测和改进建议的完整报告。无用户系统、无部署，纯本地验证核心假设：**作者是否愿意为这类质量评估工具付费？**

## User Stories

1. 作为网文作者，我想粘贴一个章节文本并点击"开始评估"，以便快速获得该章节的质量评分
2. 作为网文作者，我想看到一个 0-10 的综合评分（颜色编码），以便一眼判断章节整体质量
3. 作为网文作者，我想看到 Hook 强度评分，以便知道开头是否能抓住读者
4. 作为网文作者，我想看到爽点密度评分，以便知道章节中"爽"的节奏是否足够
5. 作为网文作者，我想看到章末悬念评分，以便知道结尾能否让读者想翻下一页
6. 作为网文作者，我想看到节奏评分，以便知道叙事节奏是否合理
7. 作为网文作者，我想看到亮点分析（先展示优点），以便获得正向反馈
8. 作为网文作者，我想看到节奏曲线图（SVG 面积图），以便可视化理解全章张力变化
9. 作为网文作者，我想看到注水检测结果，以便知道哪些段落可以精简
10. 作为网文作者，我想看到改进建议（建设性语气），以便知道下一步怎么改
11. 作为网文作者，我想看到 7 步进度条和中文提示文字，以便了解评估进行到哪一步
12. 作为网文作者，我想在评估失败时看到部分结果（黄色提示），而不是完全报错
13. 作为网文作者，我想在输入少于 1000 字时收到友好提示，而不是硬性报错
14. 作为网文作者，我想在输入超过 50000 字时收到分段建议
15. 作为网文作者，我想看到评估历史（最近 10 次），以便对比不同版本的效果
16. 作为网文作者，我想在评估时看到骨架屏加载状态，而不是空白页面
17. 作为网文作者，我想在空状态时看到引导卡片，告诉我该怎么开始
18. 作为网文作者，我想在 API 超时时看到重试按钮，而不是死循环
19. 作为网文作者，我想看到一致性检查结果，以便发现逻辑矛盾
20. 作为网文作者，我希望评分低于 5 分时不会只显示一个红色数字，而是附带具体建议
21. 作为开发者，我想通过 Zod schema 验证 LLM 输出，以便保证数据结构正确
22. 作为开发者，我想在 LLM 返回格式错误时自动重试一次，以便提高成功率
23. 作为开发者，我想在日志中记录每次评估的 token 用量和 API 成本，以便控制预算
24. 作为开发者，我想对同一章节多次评估时保留历史记录，以便分析 LLM 一致性
25. 作为开发者，我想在 LLM 方差超过 0.5 时收到异常日志，以便及时排查
26. 作为开发者，我想通过 Jest 测试覆盖所有 6 个模块，以便保证重构安全
27. 作为开发者，我想通过 golden sample 快照测试验证评估输出格式稳定性
28. 作为验证者，我想用 10 个不同长度的样本章节测试成本，以便确认单章评估费用 ≤ 0.5 元
29. 作为验证者，我想让 5 位作者试用原型并回答两个问题：报告是否有用？29 元/月是否愿意购买？

## Implementation Decisions

### 模块 1: LLM Client

- 使用 `openai` npm 包调用 DeepSeek API（OpenAI 兼容协议）
- 所有调用强制 `temperature=0`
- 内置指数退避重试：超时 1s→2s，429 错误 2s→4s，最多 2 次重试
- 输出处理管线：strip markdown fences → JSON.parse (try-catch) → Zod schema 校验 → 失败重试 1 次
- Zod schema 定义 LLM 返回结构：hookScore (0-10), climaxScore (0-10), cliffhangerScore (0-10), pacingScore (0-10), consistencyIssues (array), highlights (array), suggestions (array)
- API Key 从环境变量 `DEEPSEEK_API_KEY` 读取
- 模块接口：`evaluateWithLLM(text: string, prompt: string): Promise<LLMResult>`

### 模块 2: Rule Engine

三个独立分析器，均可纯本地运行，无外部依赖。作为"信号提取器"，输出结构化信号供 LLM 参考：

**爽点密度分析器 (ClimaxAnalyzer)**
- 关键词匹配：5 类共 50-100 个关键词（反转/震撼/突破/冲突/情感）
- 对话密度：对话行数 / 总段落数
- 冲突事件计数：每 1000 字的冲突关键词出现次数
- 输出：参考分数 + 命中关键词列表 + `keywordCategories`（按类别分组的命中关键词）

**节奏分析器 (PacingAnalyzer)**
- 段落分类：动作 / 对话 / 描写（基于规则判断）
- 段落长度变异系数 (CV)：CV 越大节奏越有变化
- 动作:对话:描写比例评分
- 输出：参考分数 + 节奏曲线数据 + `cv`（变异系数）+ `typeRatio`（动作/对话/描写比例）

**注水检测器 (FillerDetector)**
- 段落相似度计算（字符串相似度）
- 重复句式检测
- 输出：问题段落列表 + `suspiciousPairs`（未达阈值但可疑的段落对及相似度）

- 模块接口：`analyzeClimax(text): ClimaxResult`, `analyzePacing(text): PacingResult`, `detectFiller(text): FillerResult`

### 模块 3: Evaluation Pipeline

- 两阶段架构（信号注入）：
  1. 先运行规则引擎（3 个分析器），收集结构化信号
  2. 将信号格式化为中文提示，注入 LLM 的 system prompt
  3. LLM 基于信号+原文输出全部 4 个维度分数（hookScore, climaxScore, cliffhangerScore, pacingScore）
- 降级方案：LLM 失败时标记 `isPartial: true`，使用规则引擎的参考分数作为 fallback
- 综合评分公式：`Hook × 0.3 + Climax × 0.3 + Cliffhanger × 0.25 + Pacing × 0.15`，保留 1 位小数
- Prompt 构建模块（`services/prompt/`）：将规则引擎信号格式化为结构化中文提示
- 模块接口：`evaluateChapter(text: string): Promise<EvaluationResult>`

### 模块 4: LLM Consistency Guard

三层保障：
1. **temperature=0** — 在 LLM Client 层强制，Guard 层校验配置是否生效
2. **分数 clamp** — 所有子分数强制 0-10 范围，综合分四舍五入到 1 位小数
3. **方差预算** — 同一章节 + 同一 prompt 版本，多次评估方差 < 0.5 分；超出则写入结构化日志（不阻断返回）

- 模块接口：`guardScores(raw: RawScores): ValidatedScores`

### 模块 5: Evaluation API

**POST /api/evaluate**

请求体：
- `chapterText`: string（必填，1000-50000 字符）

输入验证规则：
- null/undefined/空字符串 → 400 "请输入章节文本"
- < 1000 字符 → 400 "文本不足1000字，无法评估。建议至少1000字。"
- > 50000 字符 → 400 "文本过长，请分段提交"
- 非中文内容 → 400 "目前仅支持中文网文"

响应格式：
- 成功：200 + 完整评估报告 JSON（含 reportId, 各项分数, pacingCurve, fillerDetection, isPartial, tokenUsage, costEstimate）
- 失败：4xx/5xx + 错误 JSON（code: VALIDATION_ERROR | SERVICE_TIMEOUT | LLM_ERROR | PARTIAL_RESULT, message, details）

存储：评估完成后通过 Prisma 写入 EvaluationReport 表

### 模块 6: Web UI

单页应用，桌面端（≥1024px），单列滚动布局：

**输入区**（视口 40-50%）
- 大文本输入框 + 实时字数统计
- "开始评估" CTA 按钮（Design System primary 色）
- 空状态引导卡片

**进度条**
- 7 步文本进度：正在验证文本 → 分析爽点密度 → 分析节奏 → 评估Hook强度 → 评估章末悬念 → 检查一致性 → 生成报告

**报告展示**（内容层级）
1. 综合评分：大号 Geist Mono 数字 + 颜色编码（绿 7-10 / 黄 5-6 / 红 0-4）
2. 亮点分析：正面反馈优先展示
3. 节奏曲线：纯 SVG 面积图（无第三方图表库）
4. 改进建议：建设性语气（"建议"而非"问题"）
5. 评估历史：localStorage 存储，最近 10 条

**交互状态**
- 加载：骨架屏
- 空状态：引导卡片 + 图标 + 行动提示
- 错误：红色卡片 + 图标 + 重试按钮
- 部分失败：黄色横幅 + 可用的部分结果
- 成功：完整报告

**情感设计规则**
- 先展示优点再展示问题
- 评分低于 5 分必须附带具体建议
- 语气为"编辑给作者的反馈"，不是"考试成绩单"

### 数据库 Schema 扩展

在现有 User/Project 基础上新增：

**Novel** — `id, userId(FK), title, genre(enum: 玄幻/都市/仙侠/科幻/历史/其他), createdAt`

**Chapter** — `id, novelId(FK), number(int), title, content(text), createdAt`

**EvaluationReport** — `id, chapterId(FK), hookScore, climaxDensity, cliffhangerScore, pacingScore, overallScore, consistencyIssues(JSON), pacingCurve(JSON), fillerDetection(JSON), isPartial(bool), rawLLMResponse(text), tokenUsage(int), costEstimate(float), createdAt`

CharacterProfile 和 SettingConstraint 表在 Schema 中预定义但 P0 不使用，Phase 2 启用。

### 关键词词典

5 类共 50-100 个关键词：
- 反转类 (15-20): 打脸、碾压、翻身、逆转、翻盘……
- 震撼类 (10-15): 震撼、目瞪口呆、不敢相信、惊呆……
- 突破类 (10-15): 突破、晋级、觉醒、蜕变、升级……
- 冲突类 (10-15): 挑战、对决、战斗、厮杀、较量……
- 情感类 (10-15): 感动、心酸、热泪、温暖、泪目……

### 可观测性

结构化 JSON 日志：
- 每次评估记录：chapterId, tokenUsage, costEstimate, duration, isPartial
- LLM 方差异常日志：variance > 0.5 时记录
- 关键指标：评估总数/成功/失败/部分、响应时间 p50/p95/p99、token 消耗、API 成本

### 架构决策

- P0 采用前后端分离架构（frontend/ + backend/），backend 运行在端口 3001
- DeepSeek API 通过 `openai` npm 包直接调用，无需 Python 服务
- 规则引擎在 Next.js API Routes 中以 in-process 方式运行
- 数据库使用 PostgreSQL + Prisma 7（adapter 模式）
- 前端通过 `apiFetch` 工具函数调用后端 API

## Testing Decisions

**测试原则：** 只测外部行为，不测实现细节。测试应该回答"模块是否做了它承诺的事"，而不是"模块内部怎么做的"。

**测试框架：** Jest

**各模块测试策略：**

| 模块 | 测试类型 | 覆盖内容 |
|------|----------|----------|
| LLM Client | 单元测试 | Zod schema 校验（有效/无效输入）、重试逻辑（mock API 返回超时/429/格式错误）、markdown fence 清理、temperature=0 配置验证 |
| Rule Engine | 单元测试 + Golden Sample | 关键词命中率（已知文本 → 预期分数）、节奏曲线输出格式、注水检测准确性、边界情况（空文本/纯对话/纯描写） |
| Evaluation Pipeline | 集成测试 | 信号注入架构（规则引擎信号 → prompt 构建 → LLM 评分）、部分失败处理（LLM 超时 → 降级到规则引擎分数）、综合评分计算正确性 |
| LLM Consistency Guard | 单元测试 | 分数 clamp（负数→0, 超10→10）、方差预算（同文本多次评估方差 < 0.5）、边界值处理 |
| Evaluation API | 集成测试 | 输入验证（null/空/太短/太长/非中文）、成功响应格式、错误响应格式、部分评估响应、Prisma 写入验证 |
| Web UI | 组件测试 | 各交互状态渲染（loading/empty/error/success/partial）、进度条步骤切换、报告内容层级、字数统计、历史记录读写 |

**Golden Sample 测试：**
- 准备 3-5 个固定章节文本样本
- 预期输出作为快照存储
- 每次 CI 运行对比快照，检测评估逻辑是否意外变化

**成本测试（非自动化）：**
- 10 个不同长度的样本章节（500/1000/2000/3000/5000/8000/10000/15000/20000/30000 字）
- 记录每次评估的 token 用量和 API 成本
- 确认单章评估费用 ≤ 0.5 元

## Out of Scope

以下功能**明确不在 P0 范围内**：

- 用户系统（注册、登录、认证、权限）
- 部署（Vercel、Supabase 等线上环境）
- 记忆管理（角色档案提取、世界观知识图谱）
- AI 文本生成（续写、扩写、润色）
- 商业化分析（IP 改编潜力、签约概率、收入模型）
- 移动端适配（P0 仅桌面端 ≥1024px）
- 内容审核（依赖 DeepSeek 安全策略）
- 深度一致性检查（基于角色档案的逻辑矛盾检测，Phase 2 启用）
- Python 微服务（Phase 2+ 按需引入）
- 暗色模式（DESIGN.md 有定义但 P0 不实现）
- 多语言支持

## Further Notes

### Go/No-Go 标准（第 4 周末）

| 指标 | 阈值 | 行动 |
|------|------|------|
| 作者付费意愿 | ≥ 3/5 说"会买" | 进入 Phase 1 |
| 作者付费意愿 | < 3/5 说"会买" | 重新定位 |
| 单章评估成本 | ≤ 0.5 元 | 继续 |
| 单章评估成本 | > 0.5 元 | 考虑纯规则引擎或调整定价 |
| 报告有用性评分 | ≥ 4.0/5.0 | 继续 |
| 报告有用性评分 | < 3.0/5.0 | 重新设计评估管线 |
| LLM 评分方差 | < 0.5 分 | 继续 |
| LLM 评分方差 | ≥ 1.0 分 | 需增加一致性保障措施 |

### 风险

1. **Prompt 工程时间可能不足** — 已分配 5 天，可能需要更多迭代
2. **LLM 评估一致性是最大风险** — 三层保障（temperature=0 + clamp + 方差预算）缓解
3. **关键词词典质量** — 从 50-100 词起步，基于反馈迭代扩展
4. **竞争窗口** — 番茄/阅文 6 周可复制，数据积累是长期护城河
5. **单人开发** — 复杂度必须严格控制，验证失败时果断砍范围

### 时间线

总工期 15-20 个工作日（3-4 周）：

| 阶段 | 天数 | 内容 |
|------|------|------|
| DeepSeek API 集成 + Prompt v1 | 5 天 | openai npm 集成、Zod schema、prompt 迭代 |
| 追读力评估管线 | 5 天 | 规则引擎信号提取 + LLM 信号注入评分、降级方案 |
| LLM 一致性保障 | 1 天 | temperature=0 + clamp + 方差预算 |
| Web UI | 3 天 | 单页应用、进度条、报告展示 |
| 测试套件 | 3 天 | Jest 单元/集成/golden sample，~26 测试点 |
| 成本测试 + 作者验证 | 2 天 | 10 样本成本测试 + 5 位作者试用 |
