# Issue p1-011-01: 双栏布局 + 输入卡片重构

## What to build

将 EvaluatePage idle phase 从单栏窄布局重构为双栏桌面布局，替换裸 textarea 为 surface 卡片包裹的编辑器。

**布局变化：**
- 容器从 `max-w-lg` (512px) 扩展为 `max-w-5xl` (1024px)，充分利用桌面空间
- 两栏 flex 布局，比例 `flex-[2]` / `flex-[1]`（约 65%/35%），间距 `gap-8`
- 左栏为主工作区，右栏为辅助面板（本 Issue 先放空面板占位，内容由 p1-011-02 填充）

**左栏内容：**
- 顶部标题区：Instrument Serif 标题 "章节评估" + Plus Jakarta Sans 描述行（`text-text-muted`）
- 输入卡片：`bg-surface rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary-lighter`
- Textarea：`bg-transparent border-0 focus:outline-none focus:ring-0 min-h-[400px] text-base leading-relaxed resize-y`，卡片边框处理视觉边界
- 底部状态栏：`border-t border-border` 分割线，左 Geist Mono 字数统计 + 最低字数提示，右带 play SVG 图标的开始评估按钮

**约束：**
- 仅修改 idle phase 的 return JSX，不碰 evaluating/done/error 三态
- 所有 store selector、handler 不变（`setText`、`handleSubmit`、`handleRetry` 等）
- placeholder 文本 "输入章节文本" 保留
- button accessible name "开始评估" 保留
- 引入 `useHistoryStore(selectEntries)` 用于后续在右侧展示历史条数，但不改变历史渲染位置（p1-011-02 处理）

## Acceptance criteria

- [x] idle phase 渲染为双栏 flex 布局（`flex-[2]` / `flex-[1]`，`max-w-5xl`）
- [x] 左栏显示标题 "章节评估" + 描述行
- [x] 输入卡片包裹 textarea，卡片有 border + focus-within ring
- [x] textarea 无自身边框，背景透明，`min-h-[400px]`，`text-base`
- [x] 底部状态栏有分割线、Geist Mono 字数、play 图标开始评估按钮
- [x] 右栏显示为空面板占位
- [x] textarea 输入和字数统计正常交互
- [x] 点击按钮提交且 disabled 逻辑正常（<1000 字禁用）
- [x] evaluating/done/error 三态渲染完全不受影响
- [x] 骨架屏 `data-testid="skeleton"` 仍在 evaluating 阶段显示
- [x] 所有现有 EvaluatePage 测试通过（163 前端测试全通过）

## Blocked by

无 — 可立即开始
