# P0 Issue Tracker

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| 1 | [Prisma Schema 扩展](001-prisma-schema.md) | AFK | — | ✅ 完成 |
| 2 | [关键词词典 + 爽点密度规则引擎](002-keyword-dictionary-climax-analyzer.md) | AFK | #1 | ✅ 完成 |
| 3 | [节奏分析 + 注水检测规则引擎](003-pacing-filler-rule-engine.md) | AFK | #1 | ✅ 完成 |
| 4 | [DeepSeek LLM Client](004-llm-client.md) | AFK | #1 | ✅ 完成 |
| 5 | [LLM 一致性保障 + 评估管线编排](005-consistency-guard-pipeline.md) | AFK | #2, #3, #4 | ✅ 完成 |
| 6 | [POST /api/evaluate 端点 + 基础 UI](006-evaluate-api-basic-ui.md) | AFK | #5 | ✅ 完成 |
| 7 | [7 步进度条](007-progress-bar.md) | AFK | #6 | ✅ 完成 |
| 8 | [完整报告展示](008-report-display.md) | AFK | #6 | ✅ 完成 |
| 9 | [节奏曲线 SVG + 评估历史](009-pacing-curve-history.md) | AFK | #6 | ✅ 完成 |
| 10 | [信号注入架构重构](010-signal-injection-architecture.md) | AFK | #5, #6 | ✅ 完成 |
| 11 | [Token 用量 + 成本追踪](011-token-cost-tracking.md) | AFK | — | ✅ 完成 |
| 12 | [Golden Sample 验证](012-golden-sample-validation.md) | AFK | — | ✅ 完成 |
| 13 | [LLM 进度条细化 + 超时](013-llm-progress-timeout.md) | AFK | #12 | ✅ 完成 |
| 14 | [Hook + Cliffhanger 规则引擎兜底](014-hook-cliffhanger-rule-engine.md) | AFK | — | ✅ 完成 |
| 15 | [四维雷达图替换综合分](015-radar-chart-replace-overall.md) | AFK | #14 | ✅ 完成 |
| 16 | [报告信息架构重排](016-report-architecture-reorder.md) | AFK | #15 | ✅ 完成 |

**并行路径：**
```
#1 Schema
├── #2 爽点密度 ──┐
├── #3 节奏注水 ──┼── #5 评估管线 ── #6 API+UI ──┬── #7 进度条
└── #4 LLM Client┘                   │           ├── #8 报告展示
                                      └── #10 信号注入重构  └── #9 曲线+历史

LLM 启用阶段（新增）:
#11 成本追踪 ──┐
               ├── #13 进度条细化+超时
#12 Golden Sample┘

评分规则重构阶段（新增）:
#14 Hook+Cliffhanger 兜底 ── #15 四维雷达图 ── #16 报告架构重排
```

**当前进度：** 281 个测试通过（后端 158 + 前端 123），#1-#16 全部完成。
