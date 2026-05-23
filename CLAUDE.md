# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NovelScope** (小说望远镜) — 面向中文网文作者的AI写作质量评估与商业化辅助SaaS平台。核心差异化：追读力分析、爽点检测、一致性审查、商业化建议。定位为"分析辅助工具"而非"AI自动生成工具"。

**文档索引:** `docs/README.md` — 所有文档的目录结构和什么时候该读什么。关键入口：
- 设计系统: `docs/design/DESIGN.md`（UI 改动前必读）
- Issue 追踪: `docs/issues/README.md`（P0 → `P0/` | P1 → `P1/`）
- 技术 PRD: `docs/prd/`（P0 原型 / P1 产品化 / P1 规则引擎 v2）
- 产品定义: `docs/product/` | 市场调研 + 审查: `docs/reports/`

## 技术栈

| 层级 | 选型 |
|------|------|
| 前端 | Next.js + TypeScript + Tailwind CSS |
| 后端 | Next.js API Routes（Phase 0 单服务，Phase 2+ 可选 Python 微服务） |
| 数据库 | PostgreSQL + Prisma ORM |
| 向量数据库 | Pinecone |
| 缓存 | Redis |
| 大模型 | DeepSeek API（主）+ Claude API（辅） |
| 嵌入模型 | BGE-large-zh / Qwen3-Embedding |
| 部署 | Vercel（前端 + API Routes）|
| 支付 | 微信支付+支付宝 |

## 核心模块

1. **追读力分析系统** — 爽点密度检测、Hook钩子评估、节奏曲线、黄金三章评分、追读留存预测、伏笔债务追踪
2. **写作质量审查** — 逻辑一致性、叙事注水检测、角色声音一致性、文风稳定性、AI痕迹检测
3. **记忆管理** — 角色档案维护、世界观知识图谱、剧情线追踪、合同式约束
4. **商业化辅助** — 题材热度、平台适配、IP改编潜力、签约概率、收入模型模拟
5. **AI辅助创作** — 智能续写、扩写润色、大纲生成、角色设定生成

## 开发模式

单人+AI辅助开发。当前处于 Phase 0（验证期），核心评估管线已完整交付。

**已完成 (17 个 Issue)：**
| # | 模块 | 说明 |
|---|------|------|
| #1 | Prisma Schema | 数据模型定义（Novel/Chapter/EvaluationReport） |
| #2 | Climax 规则引擎 | 爽点密度检测，5 类 50+ 关键词，0-10 分 |
| #3 | Pacing+Filler 规则引擎 | 段落分类+张力曲线+C/V熵评分 + bigram Jaccard 注水检测 |
| #4 | LLM Client | DeepSeek-v4-flash，OpenAI SDK 兼容，45s 超时+重试 |
| #5 | Guard+Pipeline | clamp 校验+7步评估管线+LLM失败优雅降级 |
| #6 | API 端点 | `/api/evaluate` + `/api/evaluate/stream` (SSE) |
| #7 | ProgressBar | 7步进度条+预热/收尾假步骤 |
| #8 | ReportCard | 完整报告展示 |
| #9 | 节奏曲线+历史 | 张力曲线SVG+评估历史localStorage |
| #10 | 信号注入架构 | 规则引擎→LLM 结构化上下文 |
| #11 | Token用量+成本 | LLMCallResult.usage+DeepSeek 定价计算 |
| #12 | Golden Sample | 5样本×3轮，方差<0.5，CLI runner，自动报告 |
| #13 | 进度条细化+超时 | 子步骤(构建提示/调用AI/处理结果)+45s超时降级 |
| #14 | Hook+Cliffhanger | 规则引擎兜底(开头类型检测+章末悬念检测) |
| #15 | 四维雷达图 | 替换综合分(Hook/爽点/悬念/节奏雷达图) |
| #16 | 报告架构重排 | 亮点→建议(严重度分级)→雷达图→节奏→注水→一致性 |
| #17 | 节奏曲线三线重设计 | 动作/对话/描写分段折线+趋势虚线+图例交互+25个测试 |

**测试：** 289 个测试通过（后端 Jest 158 + 前端 Vitest 131）

**模型：** DeepSeek-v4-flash (temperature=0)，通过 OpenAI SDK 兼容调用

**P1 规划：** [PRD-P1-规则引擎v2重构](docs/prd/PRD-P1-规则引擎v2重构.md) — 规则引擎转型特征提取器 + Prompt v2 锚点评分 + 双模型编排。已拆分为 8 个 Issue（p1-003~010），详见 [Issue 追踪](docs/issues/README.md)。

参考 `docs/prd/PRD-P0-追读力评估原型.md` 和 `docs/issues/` 获取完整里程碑。

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore

## Design System

Always read docs/design/DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match docs/design/DESIGN.md.
