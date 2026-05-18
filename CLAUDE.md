# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NovelScope** (小说望远镜) — 面向中文网文作者的AI写作质量评估与商业化辅助SaaS平台。核心差异化：追读力分析、爽点检测、一致性审查、商业化建议。定位为"分析辅助工具"而非"AI自动生成工具"。

产品立项文档: `AI小说创作平台-产品立项定义文档.md`
MVP设计文档: `NovelScope-MVP设计文档.md`
市场调研报告: `AI小说创作市场调研报告-三方验证版.md`
CEO审查报告: `NovelScope-CEO审查报告.md`
设计系统: `DESIGN.md`

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

单人+AI辅助开发。当前处于 Phase 0（验证期），尚未开始编码。参考产品立项文档第五章获取完整里程碑。

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

Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
