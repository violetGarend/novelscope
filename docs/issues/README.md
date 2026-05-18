# P0 Issue Tracker

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| 1 | [Prisma Schema 扩展](001-prisma-schema.md) | AFK | — | 待开始 |
| 2 | [关键词词典 + 爽点密度规则引擎](002-keyword-dictionary-climax-analyzer.md) | AFK | #1 | 待开始 |
| 3 | [节奏分析 + 注水检测规则引擎](003-pacing-filler-rule-engine.md) | AFK | #1 | 待开始 |
| 4 | [DeepSeek LLM Client](004-llm-client.md) | AFK | #1 | 待开始 |
| 5 | [LLM 一致性保障 + 评估管线编排](005-consistency-guard-pipeline.md) | AFK | #2, #3, #4 | 待开始 |
| 6 | [POST /api/evaluate 端点 + 基础 UI](006-evaluate-api-basic-ui.md) | AFK | #5 | 待开始 |
| 7 | [7 步进度条](007-progress-bar.md) | AFK | #6 | 待开始 |
| 8 | [完整报告展示](008-report-display.md) | AFK | #6 | 待开始 |
| 9 | [节奏曲线 SVG + 评估历史](009-pacing-curve-history.md) | AFK | #6 | 待开始 |

**并行路径：**
```
#1 Schema
├── #2 爽点密度 ──┐
├── #3 节奏注水 ──┼── #5 评估管线 ── #6 API+UI ──┬── #7 进度条
└── #4 LLM Client┘                                ├── #8 报告展示
                                                   └── #9 曲线+历史
```
