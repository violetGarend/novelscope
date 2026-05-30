# Issue Tracker

> **文件夹结构:** P0 → `P0/` | P1 → `P1/` | PRD → `../`

## P0 Issue Tracker

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| 1 | [Prisma Schema 扩展](P0/001-prisma-schema.md) | AFK | — | ✅ 完成 |
| 2 | [关键词词典 + 爽点密度规则引擎](P0/002-keyword-dictionary-climax-analyzer.md) | AFK | #1 | ✅ 完成 |
| 3 | [节奏分析 + 注水检测规则引擎](P0/003-pacing-filler-rule-engine.md) | AFK | #1 | ✅ 完成 |
| 4 | [DeepSeek LLM Client](P0/004-llm-client.md) | AFK | #1 | ✅ 完成 |
| 5 | [LLM 一致性保障 + 评估管线编排](P0/005-consistency-guard-pipeline.md) | AFK | #2, #3, #4 | ✅ 完成 |
| 6 | [POST /api/evaluate 端点 + 基础 UI](P0/006-evaluate-api-basic-ui.md) | AFK | #5 | ✅ 完成 |
| 7 | [7 步进度条](P0/007-progress-bar.md) | AFK | #6 | ✅ 完成 |
| 8 | [完整报告展示](P0/008-report-display.md) | AFK | #6 | ✅ 完成 |
| 9 | [节奏曲线 SVG + 评估历史](P0/009-pacing-curve-history.md) | AFK | #6 | ✅ 完成 |
| 10 | [信号注入架构重构](P0/010-signal-injection-architecture.md) | AFK | #5, #6 | ✅ 完成 |
| 11 | [Token 用量 + 成本追踪](P0/011-token-cost-tracking.md) | AFK | — | ✅ 完成 |
| 12 | [Golden Sample 验证](P0/012-golden-sample-validation.md) | AFK | — | ✅ 完成 |
| 13 | [LLM 进度条细化 + 超时](P0/013-llm-progress-timeout.md) | AFK | #12 | ✅ 完成 |
| 14 | [Hook + Cliffhanger 规则引擎兜底](P0/014-hook-cliffhanger-rule-engine.md) | AFK | — | ✅ 完成 |
| 15 | [四维雷达图替换综合分](P0/015-radar-chart-replace-overall.md) | AFK | #14 | ✅ 完成 |
| 16 | [报告信息架构重排](P0/016-report-architecture-reorder.md) | AFK | #15 | ✅ 完成 |
| 17 | [节奏曲线三线重设计 + 图例交互](P0/017-pacing-curve-redesign.md) | AFK | #9 | ✅ 完成 |

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

**当前进度：** 428 个测试通过（后端 Jest 282 + 前端 Vitest 146），#1-#17 全部完成，P0 阶段交付完毕。P1.0~P1.2 (p1-001~011) 完成。P1.3 UI 改版进行中：评估报告页已全面重构为杂志编辑排版风格。

## P0 完成里程碑

| 阶段 | Issues | 成果 |
|------|--------|------|
| 基础设施 | #1 | Prisma Schema — Novel/Chapter/EvaluationReport 数据模型 |
| 规则引擎 | #2, #3, #14 | 四大规则引擎：爽点密度 / 节奏分析 / 注水检测 / Hook+Cliffhanger |
| AI 集成 | #4, #5, #10 | DeepSeek-v4-flash 客户端 + 信号注入架构 + 一致性保障 |
| 评估管线 | #6, #7, #8, #9, #13 | API 端点 + SSE 流式 + 7步独立计时器进度条 + 杂志排版报告 + 节奏曲线 + 评估历史 |
| 质量保障 | #11, #12 | Token 用量+成本追踪 + Golden Sample 验证(5样本×3轮,方差<0.5) |
| 报告优化 | #15, #16, #17 | 四维雷达图替换综合分 + 报告信息架构重排 + 节奏曲线三线重设计 |

## P1 Issue Tracker

**PRD:** [P1 规则引擎 v2 重构 — 从评分者到特征提取器](../prd/PRD-P1-规则引擎v2重构.md) (2026-05-23, ready-for-agent)

### P1.0 安全+基础设施

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-001 | [安全修复 — API key 轮换 + git 历史清理 + env 校验](P1/p1-001-security-fix.md) | AFK | — | ✅ 完成 |
| p1-002 | [CORS 中间件 + CI/CD](P1/p1-002-cors-ci.md) | AFK | — | ✅ 完成 |

### P1.1 规则引擎 v2 重构（8 个 Issue：p1-003~010）

**PRD:** [P1 规则引擎 v2 重构 — 从评分者到特征提取器](../prd/PRD-P1-规则引擎v2重构.md)

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-003 | [规则引擎 v2 — 从评分者到特征提取器](P1/p1-003-engine-v2-features.md) | AFK | — | ✅ 完成 |
| p1-004 | [Prompt v2 — 6 锚点评分 + 特征注入 + 软化分布](P1/p1-004-prompt-v2-anchors.md) | AFK | p1-003 | ✅ 完成 |
| p1-005 | [校准 CLI + Prompt v2 验证（P1 Gate）](P1/p1-005-calibration-cli-gate.md) | AFK | p1-004 | ✅ 完成 |
| p1-006 | [双模型编排 + 降级路径](P1/p1-006-dual-model-orchestration.md) | AFK | p1-005（条件：校准通过） | ✅ 完成 |
| p1-007 | [Guard 扩展 — 分歧检测](P1/p1-007-guard-divergence.md) | AFK | p1-006 | ✅ 完成 |
| p1-008 | [Degrade-Report 独立服务 — 模板 NLG](P1/p1-008-degrade-report-service.md) | AFK | — | ✅ 完成 |
| p1-009 | [Filler O(n²) 性能优化](P1/p1-009-filler-performance.md) | AFK | — | ✅ 完成 |
| p1-010 | [前端适配新数据结构 — 双模型雷达图 + 降级 UI](P1/p1-010-frontend-v2-adaptation.md) | AFK | p1-003, p1-006, p1-008 | ✅ 完成 |

### P1.2 用户系统

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-011 | [用户模型扩展 + JWT 认证服务](P1/p1-011-auth-service.md) | AFK | — | ✅ 完成 |
| p1-012 | [GitHub OAuth + 认证守卫](P1/p1-012-github-oauth-guard.md) | AFK | p1-011 | ⏳ 待开始 |
| p1-013 | [认证 UI — 登录/注册页 + AuthProvider + 受保护路由](P1/p1-013-auth-ui.md) | AFK | p1-011 | ⏳ 待开始 |

### P1.3 评估界面 UI 改版

**PRD:** [P1.3 评估界面 UI 改版](../prd/PRD-P1.3-评估界面UI改版.md)

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-011-01 | [双栏布局 + 输入卡片重构](P1/p1-011-01-two-column-layout.md) | AFK | — | ✅ 完成 |
| p1-011-02 | [右侧面板内容 + 历史组件视觉优化](P1/p1-011-02-right-panel-history.md) | AFK | p1-011-01 | ✅ 完成 |
| p1-011-03 | [快速示例文本](P1/p1-011-03-quick-samples.md) | AFK | p1-011-01 | ✅ 完成 |

### P1.4 持久化

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-014 | [持久化服务 — Novel/Chapter/Report CRUD](P1/p1-014-persistence-service.md) | AFK | p1-012 | ⏳ 待开始 |
| p1-015 | [评估历史 API + localStorage 迁移](P1/p1-015-history-migration.md) | AFK | p1-014 | ⏳ 待开始 |
| p1-016 | [仪表盘 UI — 小说管理 + 评估历史页](P1/p1-016-dashboard-ui.md) | AFK | p1-014, p1-015 | ⏳ 待开始 |
| p1-017 | [报告分享链接](P1/p1-017-report-sharing.md) | AFK | p1-014 | ⏳ 待开始 |

### P1.5 向量记忆

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-018 | [pgvector 搭建 + VectorStore 接口抽象](P1/p1-018-pgvector-setup.md) | AFK | — | ⏳ 待开始 |
| p1-019 | [实体提取 + 本地嵌入](P1/p1-019-entity-embedding.md) | AFK | p1-018 | ⏳ 待开始 |
| p1-020 | [记忆注入评估管线](P1/p1-020-memory-injection.md) | AFK | p1-019, p1-014 | ⏳ 待开始 |
| p1-021 | [Memory 管理 UI](P1/p1-021-memory-ui.md) | AFK | p1-019 | ⏳ 待开始 |

### P1.6 扩展评估

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-022 | [文风分析规则引擎](P1/p1-022-style-analysis.md) | AFK | — | ⏳ 待开始 |
| p1-023 | [AI 痕迹检测 + 题材热度](P1/p1-023-ai-detection-trend.md) | AFK | — | ⏳ 待开始 |
| p1-024 | [扩展评估管线集成 + UI 选择器](P1/p1-024-extended-pipeline-ui.md) | AFK | p1-022, p1-023, p1-014 | ⏳ 待开始 |

### P1.7 商业化

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-025 | [PayJS 支付 + 配额系统](P1/p1-025-payment-quota.md) | AFK | p1-012 | ⏳ 待开始 |
| p1-026 | [定价 UI + 支付流程](P1/p1-026-pricing-ui.md) | AFK | p1-025 | ⏳ 待开始 |

### P1.8 节奏曲线增强

| # | 切片 | 类型 | 依赖 | 状态 |
|---|------|------|------|------|
| p1-027 | [LLM 段落分类介入节奏曲线](P1/p1-027-llm-classify-pacing.md) | AFK | p1-006, p1-010 | ⏳ 待开始 |

---

**P1 并行路径：**

```
P1.0 安全+基础设施:
p1-001 安全修复 ──┬── p1-002 CORS+CI
                  └── (并行，无依赖)

P1.1 规则引擎 v2 重构（最高优先级 — 基础架构变更）:
p1-003 引擎v2 ── p1-004 Prompt v2 ── p1-005 校准 CLI (GATE) ── p1-006 双模型 ── p1-007 Guard
    │                                                                   │
    ├── p1-008 Degrade-Report (并行)                                     │
    ├── p1-009 Filler 性能 (并行)                                        │
    └────────────────────────────────────────────────────────────────── p1-010 前端

P1.2 用户系统:
p1-011 JWT 认证 ──┬── p1-012 GitHub OAuth+守卫
                   ├── p1-013 认证 UI

P1.3 评估界面 UI 改版:
p1-011-01 双栏布局 ──┬── p1-011-02 右侧面板+历史
                      ├── p1-011-03 快速示例

P1.4 持久化:
p1-012 认证守卫 ── p1-014 持久化服务 ──┬── p1-015 历史迁移 ── p1-016 仪表盘 UI
                                       ├── p1-017 报告分享
                                       └── p1-024 扩展管线 (共享依赖)

P1.5 向量记忆:
p1-018 pgvector ── p1-019 实体提取+嵌入 ──┬── p1-020 记忆注入管线
                                          └── p1-021 Memory UI

P1.6 扩展评估:
p1-022 文风分析 ──┬── p1-024 扩展管线集成+UI
p1-023 AI+题材 ──┘

P1.7 商业化:
p1-025 支付+配额 ── p1-026 定价 UI

P1.8 节奏曲线增强（基于 P1.1 基础设施）:
p1-006 双模型 ── p1-027 LLM 段落分类
p1-010 前端 V2 ──┘
```

## P1 阶段规划

| 阶段 | Issues | 成果 | 优先级理由 |
|------|--------|------|-----------|
| P1.0 | p1-001, p1-002 | API key 轮换 + CORS 中间件 + CI 搭建 | **安全第一** |
| P1.1 | p1-003~010 | 规则引擎转型特征提取器 + Prompt v2 锚点评分 + 双模型编排 + 前端适配 | **基础架构变更**，8 个 Issue，p1-005 为 Gate |
| P1.2 | p1-011, p1-012, p1-013 | 用户注册/登录/GitHub OAuth + 认证 UI | 用户身份体系，持久化前提 |
| P1.3 | p1-011-01~03 | 评估界面 UI 改版 — 双栏布局 + 右侧面板 + 快速示例 | 提升产品质感，解决当前界面过于简陋的问题 | ✅ 完成 |
| P1.4 | p1-014, p1-015, p1-016, p1-017 | 评估结果入库 + 历史仪表盘 + 报告分享 | 数据持久化，依赖引擎架构稳定 |
| P1.5 | p1-018, p1-019, p1-020, p1-021 | pgvector 向量记忆上线 | 长篇小说记忆管理，依赖持久化 |
| P1.6 | p1-022, p1-023, p1-024 | 文风/AI检测/题材热度 | 扩展评估维度 |
| P1.7 | p1-025, p1-026 | 微信/支付宝支付 + 三级会员 | 商业化，依赖用户系统 |
| P1.8 | p1-027 | LLM 段落分类 — 5基础类型+isEpic 节奏曲线 | 基于 P1.1 双模型基础设施，提升曲线信息密度 |
