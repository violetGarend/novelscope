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
| 17 | [节奏曲线三线重设计 + 图例交互](017-pacing-curve-redesign.md) | AFK | #9 | ✅ 完成 |

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

**当前进度：** 289 个测试通过（后端 158 + 前端 131），#1-#17 全部完成，P0 阶段交付完毕。

## P0 完成里程碑

| 阶段 | Issues | 成果 |
|------|--------|------|
| 基础设施 | #1 | Prisma Schema — Novel/Chapter/EvaluationReport 数据模型 |
| 规则引擎 | #2, #3, #14 | 四大规则引擎：爽点密度 / 节奏分析 / 注水检测 / Hook+Cliffhanger |
| AI 集成 | #4, #5, #10 | DeepSeek-v4-flash 客户端 + 信号注入架构 + 一致性保障 |
| 评估管线 | #6, #7, #8, #9, #13 | API 端点 + SSE 流式 + 7步进度条(含预热/收尾) + 报告展示 + 节奏曲线 + 评估历史 |
| 质量保障 | #11, #12 | Token 用量+成本追踪 + Golden Sample 验证(5样本×3轮,方差<0.5) |
| 报告优化 | #15, #16 | 四维雷达图替换综合分 + 报告信息架构重排(亮点→建议→可视化) |

## P1 Issue Tracker

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-001 | [安全修复 — API key 轮换 + git 历史清理 + env 校验](p1-001-security-fix.md) | AFK | — | ⏳ 待开始 |
| p1-002 | [CORS 中间件 + CI/CD](p1-002-cors-ci.md) | AFK | — | ⏳ 待开始 |
| p1-003 | [用户模型扩展 + JWT 认证服务](p1-003-auth-service.md) | AFK | — | ⏳ 待开始 |
| p1-004 | [GitHub OAuth + 认证守卫](p1-004-github-oauth-guard.md) | AFK | p1-003 | ⏳ 待开始 |
| p1-005 | [认证 UI — 登录/注册页 + AuthProvider + 受保护路由](p1-005-auth-ui.md) | AFK | p1-003 | ⏳ 待开始 |
| p1-006 | [持久化服务 — Novel/Chapter/Report CRUD](p1-006-persistence-service.md) | AFK | p1-004 | ⏳ 待开始 |
| p1-007 | [评估历史 API + localStorage 迁移](p1-007-history-migration.md) | AFK | p1-006 | ⏳ 待开始 |
| p1-008 | [仪表盘 UI — 小说管理 + 评估历史页](p1-008-dashboard-ui.md) | AFK | p1-006, p1-007 | ⏳ 待开始 |
| p1-009 | [校准版 Prompt v2 — 评分锚点 + 强制分布](p1-009-prompt-v2-calibration.md) | AFK | — | ⏳ 待开始 |
| p1-010 | [多 Provider LLM 客户端 — Claude 集成 + 双模型编排](p1-010-multi-provider-llm.md) | AFK | — | ⏳ 待开始 |
| p1-011 | [校准 CLI + Golden Sample 自动回归](p1-011-calibration-cli.md) | AFK | p1-009, p1-010 | ⏳ 待开始 |
| p1-012 | [双模型对比 UI — 雷达图双色叠加 + 差异标注](p1-012-dual-model-ui.md) | AFK | p1-010 | ⏳ 待开始 |
| p1-013 | [pgvector 搭建 + VectorStore 接口抽象](p1-013-pgvector-setup.md) | AFK | — | ⏳ 待开始 |
| p1-014 | [实体提取 + 本地嵌入](p1-014-entity-embedding.md) | AFK | p1-013 | ⏳ 待开始 |
| p1-015 | [记忆注入评估管线](p1-015-memory-injection.md) | AFK | p1-014, p1-006 | ⏳ 待开始 |
| p1-016 | [Memory 管理 UI](p1-016-memory-ui.md) | AFK | p1-014 | ⏳ 待开始 |
| p1-017 | [文风分析规则引擎](p1-017-style-analysis.md) | AFK | — | ⏳ 待开始 |
| p1-018 | [AI 痕迹检测 + 题材热度](p1-018-ai-detection-trend.md) | AFK | — | ⏳ 待开始 |
| p1-019 | [扩展评估管线集成 + UI 选择器](p1-019-extended-pipeline-ui.md) | AFK | p1-017, p1-018, p1-006 | ⏳ 待开始 |
| p1-020 | [报告分享链接](p1-020-report-sharing.md) | AFK | p1-006 | ⏳ 待开始 |
| p1-021 | [PayJS 支付 + 配额系统](p1-021-payment-quota.md) | AFK | p1-004 | ⏳ 待开始 |
| p1-022 | [定价 UI + 支付流程](p1-022-pricing-ui.md) | AFK | p1-021 | ⏳ 待开始 |

**P1 并行路径：**

```
P1.0 安全+基础设施:
p1-001 安全修复 ──┬── p1-002 CORS+CI
                  └── (并行，无依赖)

P1.1 用户系统:
p1-003 JWT 认证 ──┬── p1-004 GitHub OAuth+守卫
                  ├── p1-005 认证 UI

P1.2 持久化:
p1-004 认证守卫 ── p1-006 持久化服务 ──┬── p1-007 历史迁移 ── p1-008 仪表盘 UI
                                       ├── p1-020 报告分享
                                       └── p1-019 扩展管线 (共享依赖)

P1.3 评分校准+多模型:
p1-009 Prompt v2 ──┬── p1-011 校准 CLI
p1-010 双模型 ────┘   p1-012 双模型 UI

P1.4 向量记忆:
p1-013 pgvector ── p1-014 实体提取+嵌入 ──┬── p1-015 记忆注入管线
                                          └── p1-016 Memory UI

P1.5 扩展评估:
p1-017 文风分析 ──┬── p1-019 扩展管线集成+UI
p1-018 AI+题材 ──┘

P1.6 商业化:
p1-021 支付+配额 ── p1-022 定价 UI
```

## P1 阶段规划

| 阶段 | Issues | 成果 | 预计周 |
|------|--------|------|--------|
| P1.0 | p1-001, p1-002 | API key 轮换 + CORS 中间件 + CI 搭建 | 第 1-2 周 |
| P1.1 | p1-003, p1-004, p1-005 | 用户注册/登录/GitHub OAuth + 认证 UI | 第 2-4 周 |
| P1.2 | p1-006, p1-007, p1-008 | 评估结果入库 + 历史仪表盘 | 第 4-6 周 |
| P1.3 | p1-009, p1-010, p1-011, p1-012 | 评分校准 + DeepSeek/Claude 双模型对比 | 第 5-8 周 |
| P1.4 | p1-013, p1-014, p1-015, p1-016 | pgvector 向量记忆上线 | 第 7-10 周 |
| P1.5 | p1-017, p1-018, p1-019, p1-020 | 文风/AI检测/题材热度 + 报告分享 | 第 8-11 周 |
| P1.6 | p1-021, p1-022 | 微信/支付宝支付 + 三级会员 | 第 10-13 周 |
