# Docs

## 目录结构

| 目录 | 用途 | 什么时候用 |
|------|------|-----------|
| [`prd/`](prd/) | 技术 PRD — P0 追读力评估、P1 产品化、P1 规则引擎 v2 重构 | 理解某个功能为什么做、怎么做的完整技术方案 |
| [`design/`](design/) | 设计系统 + MVP 设计文档 | UI/视觉决策前必读，组件规范、颜色、字体 |
| [`reports/`](reports/) | 审查报告 + 市场调研 + Golden Sample 验证结果 | 了解项目决策背景、市场定位、质量基准 |
| [`product/`](product/) | 产品立项定义 | 理解产品定位、核心差异化、目标用户 |
| [`assets/`](assets/) | 图片、截图、流程图 | 文档引用、PR/Issue 配图 |
| [`issues/`](issues/) | Issue 追踪表 + P0/P1 所有 Issue 文件 | 查看进度、开发新功能前确认是否有对应 Issue |

## 什么时候读什么

**开始新功能开发 →** [`issues/README.md`](issues/README.md) 确认是否有对应 Issue，然后读 Issue 文件了解验收标准。

**做 UI/样式改动 →** 先读 [`design/DESIGN.md`](design/DESIGN.md) 了解设计 token 和规范。

**理解架构设计 →** 读对应阶段的 PRD：[`prd/`](prd/) 目录。

**写测试/了解质量基准 →** 读 [`reports/golden-sample-report.md`](reports/golden-sample-report.md)。

**理解产品方向 →** 读 [`product/AI小说创作平台-产品立项定义文档.md`](product/AI小说创作平台-产品立项定义文档.md)。

## 注意事项

- ISSUE 优先 — 每个需求都应该有对应的 Issue，通过 Issue 追踪进度
- DESIGN.md 优先 — 任何 UI 改动必须先对照设计系统
- PRD 是权威 — 实现细节有歧义时，以 PRD 为准
