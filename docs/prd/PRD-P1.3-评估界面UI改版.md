# PRD: P1.3 — 评估界面 UI 改版

## Problem Statement

当前评估输入界面过于简陋。核心评估管线（P0）和规则引擎 v2（P1.0-1.2）已交付强大的后端分析能力，但前端输入页面停留在一个裸 `<textarea>` + 按钮 + 历史列表的状态，缺乏视觉层次和操作引导，与新交付的双模型雷达图、节奏曲线等高信息密度报告形成巨大反差。

具体问题：

1. **界面简陋** — 单栏 max-w-lg 窄布局，裸 textarea 无卡片包裹，像 2005 年 HTML 表单而非现代 SaaS 工具
2. **无操作引导** — 新用户打开页面不知道需要输入多少字、评估什么内容、如何获得最佳结果
3. **空间浪费** — 桌面端 1920px 宽度只用了 512px，右侧大面积空白闲置
4. **历史入口深** — 评估历史在输入框下方，需要滚动才能看到，没有被作为一等信息展示
5. **缺乏编辑工具感** — 设计系统定义的是 "Industrial/Utilitarian" 专业编辑工具质感，当前界面未体现

## Solution

将评估输入页从单栏窄布局改版为**双栏桌面布局**：

- **左栏（主工作区，~65%）**：包含页面标题、surface 卡片包裹的 textarea 编辑器、字数统计、开始评估按钮、快速示例文本
- **右栏（辅助面板，~35%）**：包含评估指南、历史评估列表、写作小贴士

保持 evaluating/done/error 三态不变，仅重构 idle phase 的布局和视觉设计。严格遵循现有 Design System 的 token、配色、字体体系。

## User Stories

1. 作为网文作者，我希望评估页面看起来像一个专业的编辑工具，以便我信任其分析结果的权威性
2. 作为网文作者，我希望输入区有足够的宽度和高度，以便粘贴完整章节时不被 cramped 的空间困扰
3. 作为网文作者，我希望右侧面板有评估指南，以便了解什么样的文本适合评估、有什么要求
4. 作为网文作者，我希望在右侧能看到历史评估记录，以便在输入新文本时参考之前的分析
5. 作为网文作者，我希望点击"快速示例"按钮自动填充示例文本，以便立刻体验评估功能而无需自己打字
6. 作为网文作者，我希望字数统计以醒目的等宽数字展示，以便清晰感知是否满足最低字数要求
7. 作为网文作者，我希望看到写作小贴士，以便在日常使用中获得额外的写作启发
8. 作为开发者，我希望 idle phase 的改版不破坏 evaluating/done/error 三态，以便现有评估管线完全不受影响
9. 作为开发者，我希望所有视觉 token 复用现有 Design System，以便不引入额外的设计债务

## Implementation Decisions

### 模块划分

**EvaluatePage（主模块，大幅修改）**
- idle phase 返回 JSX 从单栏重写为双栏 flex 布局
- 左栏：标题区 → 输入卡片（surface 包裹 borderless textarea）→ 字数状态栏 → 快速示例区
- 右栏：评估指南卡片 → 历史评估卡片 → 写作小贴士卡片
- `max-w-5xl` 充分利用桌面空间，两栏比例 `flex-[2]` / `flex-[1]`
- `focus-within:ring-2` 卡片级焦点管理替代 textarea 自身 border
- 新增快速示例功能：内置 2-3 段示例文本，点击填充到 textarea
- 新增写作小贴士：静态 tips 列表，每行一条，可后续扩展为随机轮换

**EvaluationHistory（小幅优化）**
- 条目添加小圆点指示器（group-hover 变色）
- 时间戳改用 `font-mono tabular-nums`
- 空状态改为虚线边框卡片

### 架构边界

- **不开新文件** — 所有改动在 EvaluatePage.tsx 和 EvaluationHistory.tsx 内完成
- **不动 store** — Zustand store、selectors、types 零改动
- **不动其他状态** — ProgressBar、ReportCard、evaluating/done/error 三态完全不变
- **不改测试** — 现有测试通过 text/role 查询匹配 UI，新结构保留所有关键 text node

### 具体设计

```
Layout: max-w-5xl mx-auto
┌──────────────────────────────────────────────────────────────┐
│ flex-row gap-8                                               │
│                                                              │
│ ┌─────────────────────┐  ┌────────────────────────────────┐  │
│ │ Left (flex-[2])     │  │ Right (flex-[1])               │  │
│ │                     │  │                                │  │
│ │ Title: 章节评估     │  │ Card: 评估指南                 │  │
│ │ Subtitle: 描述      │  │  • 至少1000字                  │  │
│ │                     │  │  • 完整章节段落                 │  │
│ │ Card (surface):     │  │  • 避免超短对话片段             │  │
│ │  ┌───────────────┐  │  │                                │  │
│ │  │ textarea      │  │  │ Card: 历史评估                 │  │
│ │  │ borderless    │  │  │  (EvaluationHistory)           │  │
│ │  │ min-h-[400px] │  │  │                                │  │
│ │  └───────────────┘  │  │ Card: 写作小贴士               │  │
│ │  ── border-t ─────  │  │  • 黄金三章开头技巧             │  │
│ │  字数 | [▶开始评估]  │  │  • Hook设定建议                │  │
│ │                     │  │                                │  │
│ │ 快速试试: [示例]     │  │                                │  │
│ └─────────────────────┘  └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Design Token 使用

全部复用 globals.css 中已有 token，不新增：

| 用途 | Token |
|------|-------|
| 页面背景 | `bg-background` (#F5F3EF) |
| 卡片背景 | `bg-surface` (#FFFFFF) |
| 卡片边框 | `border-border` (#E5E5E0) |
| 主标题 | `font-display` (Instrument Serif) |
| 正文 | `font-sans` (Plus Jakarta Sans) |
| 数字/数据 | `font-mono tabular-nums` (Geist Mono) |
| 主色 | `bg-primary` / `text-primary` (#1E40AF) |
| 主色 hover | `hover:bg-primary-light` (#3B82F6) |
| 文字色 | `text-text` / `text-text-secondary` / `text-text-muted` |
| 圆角 | `rounded-lg` (8px) |
| 焦点环 | `focus-within:ring-2 focus-within:ring-primary-lighter` |

## Testing Decisions

### 测试原则

- 只测外部行为（渲染内容、交互反馈），不测内部 DOM 结构细节
- 通过 text/role 查询定位元素，不依赖具体 CSS 类名或 DOM 层级

### 覆盖范围

现有 5 个 EvaluatePage 测试 + 4 个 EvaluationHistory 测试应保持通过：
- 占位符文本 "输入章节文本" 保留
- 按钮 accessible name "开始评估" 保留
- skeleton `data-testid="skeleton"` 仅在 evaluating 阶段出现（未改动）
- 空状态文本 "暂无评估历史" 保留
- 历史条目 textSummary 和时间戳文本保留

### 新增测试建议

- 渲染右侧面板三个卡片（评估指南/历史/小贴士）
- 点击快速示例按钮后 textarea 被填充
- 双栏布局在桌面端正确渲染

## Out of Scope

- 响应式/移动端适配（Phase 0 仅桌面端，后续阶段处理）
- 暗色模式（Design System 已定义暗色 token 但未实现）
- evaluating/done/error 三态的 UI 改版
- ReportCard 的改版
- 评估管线的功能改动
- 新增第三方依赖

## Further Notes

- 本 PRD 依赖 P0 已交付的前端基础设施（Zustand store、Tailwind v4 设计 token）
- 快速示例文本建议使用 P0 Golden Sample 测试集中的文本片段
- 写作小贴士初始内容可从 docs/product/ 或 docs/reports/ 提取关键洞见
- 如后续引入 Tips 轮换机制，可将静态小贴士抽取为配置数组
