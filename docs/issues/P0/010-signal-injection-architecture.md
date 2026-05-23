# Issue #10: 规则引擎信号注入 LLM 架构重构

## What to build

将评估架构从"规则引擎直接出分 + LLM 直接出分 → 加权合并"重构为"规则引擎提取结构化信号 → 信号注入 LLM prompt → LLM 输出全部 4 个维度分数"。规则引擎改为"信号提取器"，LLM 做最终评分。

## Acceptance criteria

- [x] LLMResult schema 扩展：新增 `climaxScore` 和 `pacingScore` 字段，LLM 输出全部 4 维分数
- [x] ClimaxResult 新增 `keywordCategories: Record<string, string[]>`（按类别分组的命中关键词）
- [x] PacingResult 新增 `cv: number`（变异系数）和 `typeRatio: { action, dialogue, description }`
- [x] FillerResult 新增 `suspiciousPairs: Array<{ paragraphA, paragraphB, similarity }>`
- [x] 新建 Prompt 构建模块（`services/prompt/index.ts`）：将规则引擎信号格式化为中文结构化提示
- [x] Pipeline 重构：先运行规则引擎收集信号 → 构建 prompt → LLM 基于信号+原文出分
- [x] 修复 route.ts 空字符串 bug：`evaluateWithLLM("", "")` → `evaluateWithLLM(chapterText, prompt)`
- [x] 降级方案：LLM 失败时使用规则引擎分数作为 fallback
- [x] Mock 数据补全 `climaxScore`/`pacingScore` 字段
- [x] 全量测试通过（84 个测试）

## Architecture

```
Before:
  规则引擎 → 直接出分 ─┐
                        ├→ 加权合并 → overallScore
  LLM ─────→ 直接出分 ─┘

After:
  规则引擎 → 结构化信号 ──→ 注入LLM prompt → LLM出全部4个分 → guard → overallScore
```

## Blocked by

- #5 LLM 一致性保障 + 评估管线编排
- #6 POST /api/evaluate 端点 + 基础 UI
