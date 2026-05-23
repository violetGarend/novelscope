# PRD: P1 规则引擎 v2 重构 — 从评分者到特征提取器

## Problem Statement

当前 5 个规则引擎（climax/pacing/filler/hook/cliffhanger）各自产出 0-10 分，但评分来源是机械的关键词匹配 + 任意公式（关键词密度 × 系数 → 分数）。LLM（DeepSeek-v4-flash）覆盖规则引擎分数但趋于中值（全部 ~5.0），无法有效区分章节质量。用户看到的是不可信的数字，而非可操作的洞见。

核心问题：规则引擎在做"评分者"——它们没有能力判断质量。它们应该做"特征提取"——报告文本中实际存在什么，把判断留给 LLM。同时，单模型（DeepSeek）评分方差过低（全 5.0），需要 Prompt 重设计 + 双模型交叉验证来提升评分质量和可靠性。

## Solution

规则引擎转型为特征提取器，输出结构化特征数据（关键词命中、段落类型分布、相似度数据等）作为 LLM prompt 中的上下文。Prompt v2 引入 6 个锚点（0/2/4/6/8/10，每档配中文网文示例）和软化分布引导，替代模糊的"给个 0-10 分"。DeepSeek + 豆包 双模型并行打分，分数分歧 >2 时标记为"需人工判断"。双模型同时挂掉时，规则特征自动转化为定性报告（"AI 服务暂不可用，以下为规则分析"）。校准 CLI 作为 P1 gate——先验证 Prompt v2 单独效果（方差充足），再决定是否构建双模型。

## User Stories

1. 作为网文作者，我想看到基于真实文本特征的评分，以便信任评估结果
2. 作为网文作者，我想看到两个 AI 模型给出的分数对比，以便判断评分的可靠性
3. 作为网文作者，我想看到"两个 AI 评估一致"的标签，以便知道哪些维度评分值得信任
4. 作为网文作者，我想在看到分歧时了解两个模型各给了多少分，以便自己做判断
5. 作为网文作者，我想在 AI 服务不可用时仍能看到基于规则的分析报告，而不是空白页面
6. 作为网文作者，我想在 AI 服务恢复后点击"重新评估"按钮获取完整报告
7. 作为开发者，我想规则引擎只提取特征不打分，以便评分质量由 LLM 负责
8. 作为开发者，我想 Prompt 使用锚点评分法 + 软化分布引导，以便 LLM 分数更分散
9. 作为开发者，我想双模型分数差异 >2 时被标记并在界面上提示，以便用户知晓
10. 作为开发者，我想双模型同时失败时有降级路径（模板 NLG），以便系统不崩溃
11. 作为开发者，我想通过校准 CLI 验证 Prompt v2 效果后再启用双模型，以便避免无效投入
12. 作为开发者，我想组件测试覆盖三种报告状态（完整/降级/部分成功），以便 UI 正确渲染

## Implementation Decisions

### 模块 1: 规则引擎 v2 — 特征提取器（T1）

5 个规则引擎全部转型：保留检测逻辑，移除评分公式，输出结构化特征类型。

- 类型重命名：`*Result` → `*Features`（ClimaxFeatures / PacingFeatures / FillerFeatures / HookFeatures / CliffhangerFeatures）
- 所有 `score` 字段移除
- 保留所有检测逻辑：关键词匹配、段落分类、张力计算、相似度检测、开头/结尾类型判定
- 各引擎保持独立（不使用共享工具模块），维护明确的模块边界

**ClimaxFeatures:** matchedKeywords, keywordCategories (reversal/shock/breakthrough/conflict/emotion), dialogueDensity, conflictDensity

**PacingFeatures:** curve (PacingCurvePoint[]), cv, typeRatio (action/dialogue/description), paragraphCount

**FillerFeatures:** items (FillerItem[]), suspiciousPairs (SuspiciousPair[])

**HookFeatures:** openingType (conflict/suspense/dialogue/description/mixed), hasQuestion, hasGoldenLine, conflictHitCount, suspenseHitCount

**CliffhangerFeatures:** endingType (suspense/question/emotional/reversal/action/flat), hasQuestion, hasReversalHint, suspenseHitCount

### 模块 2: Prompt v2 — 6 锚点 + 特征注入（T2）

完整重写 prompt 服务：

- 每维度 6 个锚点级别（0/2/4/6/8/10），每个附带具体中文网文示例文本
- XML 标签分隔各维度特征和锚点参考
- 软化分布措辞："请充分利用 0-10 全量程，除非有明确理由集中在中部"
- 特征截断检测：`buildEvaluationPrompt()` 返回 `needsTruncation: boolean` 和 `truncatedFeatures`
- Prompt 服务保持纯函数，截断协调由 pipeline 层处理
- 可选保留 v1 作为 fallback，通过配置切换

### 模块 3: 双模型编排 + 降级路径（T3）

Pipeline 层扩展为多模型编排：

- 参数化 LLM 客户端配置（model + baseURL + apiKey），替代 Provider 接口抽象
- Pipeline 从 env 配置列表取前两个有 API key 的模型，自行编排 `Promise.allSettled` 并行调用
- 三态结果：
  - **双双成功** → 分数合并 + 分歧检测（>2 分标记）+ 双模型数据返回
  - **一成一败** → 使用成功方分数 + 日志记录失败 + API 响应标记 partial
  - **双双失败** → degrade-report 服务生成定性报告
- 截断协调循环：buildEvaluationPrompt → 检测 needsTruncation → LLM 摘要压缩 → 重建 prompt → 重新评分
- 纯模板 NLG 作为最终底层 fallback（不可再降级）
- 分歧处理：取均值，前端展示双方分数
- 45s 超时保持不变

### 模块 4: Guard 扩展 — 分歧检测（T4）

在现有 clamp/variance 基础上新增：

- `detectDivergence(scoresA, scoresB)` — 每维度差异 >2 标记 divergence
- 日志记录分歧事件（维度、分数差、模型信息）
- 与现有 guard 保持模块分离
- 严格 >2 触发（恰好 2.0 不标记）

### 模块 5: Degrade-Report 独立服务（T8）

新建独立服务：

- 5 引擎 Feature → 中文定性报告
- 模板 NLG：4 维度分节描述（Hook/爽点/悬念/节奏）+ 顶部总结句
- Severity heuristics：根据特征严重度调整措辞
- 独立测试覆盖

### 模块 6: 校准 CLI（T6 — P1 Gate）

新建 CLI runner：

- 5 样本 × 3 轮，方差 < 0.5
- `>= 4/5` 样本命中预期范围
- 验证 DeepSeek + Prompt v2 方差是否充足
- **GATE：验证通过才触发 T3（双模型）**
- 自动生成验证报告

### 模块 7: 前端适配（T5 — 阻塞于 T1+T3+T8）

- Discriminated union 渲染：`{status:'complete'} | {status:'degraded'} | {status:'partial'}`
- 完整态：双模型双色叠加雷达图（DeepSeek #1E40AF 蓝实线 + 豆包 #7C3AED 紫虚线）+ 图例 + 共识/分歧标签
- 分歧标记：维度旁 ⚠ 图标 + hover tooltip（双方分数 + 差值），严格 >2 触发
- 降级态：替换 LLM 区域（亮点/建议/雷达图）为定性叙述，保留规则引擎数据 + 顶部横幅 + 底部重试按钮
- 部分成功态：单模型雷达图 + 缺失模型标记 + 黄色提示条
- Token/成本：双模型模式双行展示
- 加载态：保持现有 7 步进度条
- 情感弧线：保持"优势先行"顺序（亮点→建议→雷达图→规则数据）
- 色盲适配：颜色 + 线型双重编码
- ARIA：《四维雷达图，DeepSeek 评分和豆包评分叠加显示》
- ../design/DESIGN.md 追加 2 个 color token（豆包紫、Divergence 复用 warning 橙）

### 模块 8: Filler 性能优化（T7）

- 段落数 > 200 时仅取前 200 段做对比（O(n²) → O(200²)）

### 类型系统

```typescript
// Discriminated union — 来自 Eng Review D3
type EvaluationResult =
  | { status: "complete"; scores: DualModelScores; features: AllFeatures; tokenUsage: DualTokenUsage; divergence?: DivergenceReport }
  | { status: "partial"; scores: SingleModelScores; features: AllFeatures; failedModel: string; tokenUsage: TokenUsage }
  | { status: "degraded"; report: string; features: AllFeatures; reason: string };

interface DualModelScores {
  deepseek: DimensionScores;
  doubao: DimensionScores;
}

interface DimensionScores {
  hookScore: number;
  climaxScore: number;
  cliffhangerScore: number;
  pacingScore: number;
}

interface DivergenceReport {
  dimensions: Array<{ dimension: string; deepseek: number; doubao: number; delta: number }>;
}
```

## Testing Decisions

**测试策略：** 测试行为通过公共接口，不测试实现细节。引擎测试就地改写现有测试文件。

**规则引擎测试（T1）：**
- 5 个引擎测试文件就地改写
- 旧断言：`expect(result.score).toBeGreaterThan(0)` → 移除
- 新断言：`expect(result.matchedKeywords).toContain(...)` / `expect(result.openingType).toBe(...)`
- 预估：158 → 移除约 30 个 score 相关测试，新增约 60 个特征断言测试 = ~188

**Prompt v2 测试（T2）：**
- 现有 6 个测试全部替换
- 新增：锚点内容测试、特征注入测试、截断检测测试、软化措辞测试
- 预估：~15 个测试

**Pipeline 测试（T3）：**
- 单元测试：mock DI 覆盖双模型成功/部分失败/全部失败/截断循环
- 1 个集成测试：端到端截断 → 摘要 → 重建 prompt 循环
- 预估：~12 个测试

**Guard 测试（T4）：**
- 在现有 guard 测试上追加 divergence 检测测试
- 边界值测试：2.0 不应标记、2.1 应标记

**Degrade-Report 测试（T8）：**
- 独立测试文件
- 5 引擎 Feature → 中文报告输出验证
- Template NLG 覆盖率

**前端测试（T5）：**
- ReportCard：complete/degraded/partial 三态渲染测试
- RadarChart：双多边形渲染、图例文本、分歧标记
- 预估：~25 个测试

**总体：** 后端 158 → ~206 (+48) | 前端 131 → ~156 (+25) | **总计 ~362 测试**

## Out of Scope

- 移动端响应式 — Phase 0 仅桌面端 1024px+
- 暗色模式适配 — 已有 ../design/DESIGN.md tokens，实现时按 token 适配
- 雷达图图例交互切换 — 仅展示，不提供 PacingCurve 风格的点击隐藏
- BERT 语义模型替代关键词匹配 — 延迟 + 引入新依赖
- Provider 抽象层 — 参数化配置已足够（YAGNI）
- Prisma Schema 变更 — EvaluationReport 表扩展为后续 Issue

## Further Notes

### 实现顺序（验证优先）

| 顺序 | Task | 优先级 | 预估 | Gate |
|------|------|--------|------|------|
| 1 | T1 规则引擎 v2 | P1 | human 4h / CC 1h | — |
| 2 | T2 Prompt v2 | P1 | human 6h / CC 1.5h | — |
| 3 | T6 校准 CLI | P1 | human 3h / CC 1h | **→ T3 gate** |
| 4 | T3 双模型编排 | P1 | human 4h / CC 1h | T6 通过 |
| 5 | T4 Guard 分歧检测 | P1 | human 2h / CC 0.5h | — |
| 6 | T8 Degrade-Report | P1 | human 2h / CC 0.5h | — |
| 7 | T5 前端适配 | P2 | human 3h / CC 1h | T1+T3+T8 |
| 8 | T7 Filler 性能 | P3 | human 1h / CC 0.2h | — |

### 设计决策参考

18 项 UI 设计决策（D9-D26）已在设计评审中确定，详见计划文件的 KEY DECISIONS 表。包括双模型颜色（#1E40AF 蓝实线 + #7C3AED 紫虚线）、分歧标记交互（图标 + tooltip）、降级报告信息架构（维持框架 + 分维度定性叙述）、字体/动画/ARIA 规范等。

### 与 P1 Issues 的关系

此 PRD 已拆分为 8 个独立 Issue（p1-003~010），详见 [Issue 追踪表](../issues/README.md)。原 PRD 中的任务映射：
- T2（Prompt v2）→ Issue p1-004
- T3（双模型编排）→ Issue p1-006（条件化于 p1-005 校准通过）
- T6（校准 CLI）→ Issue p1-005（P1 Gate）
- T5（前端适配）→ Issue p1-010
