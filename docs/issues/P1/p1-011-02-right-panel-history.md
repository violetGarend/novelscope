# Issue p1-011-02: 右侧面板内容 + 历史组件视觉优化

## What to build

在 p1-011-01 建立的双栏布局基础上，填充右侧面板的三个信息卡片，并优化 EvaluationHistory 组件的视觉表现。

**右侧面板卡片（从上到下）：**

1. **评估指南** — surface 卡片，带 📋 装饰和指南标题，3 条输入建议：
   - 至少输入 1,000 字以获得准确分析
   - 建议粘贴完整的章节段落，而非片段
   - 避免纯对话或超短片段，上下文越丰富分析越准确

2. **历史评估** — surface 卡片，带 📊 装饰和历史标题 + 数量角标（`font-mono text-xs text-text-muted`），渲染现有的 `<EvaluationHistory />` 组件

3. **写作小贴士** — surface 卡片，带 💡 装饰和小贴士标题，2-3 条静态写作建议：
   - 黄金三章：开篇 3000 字决定读者去留，Hook 设计至关重要
   - 爽点节奏：每 500-800 字设置一个小爽点，保持读者追读欲望
   - 对话与描写的黄金比例建议保持在 3:7 左右

**EvaluationHistory 视觉优化（EvaluationHistory.tsx）：**
- 条目左侧添加小圆点指示器（`w-1.5 h-1.5 rounded-full bg-primary/20`，group-hover 从 20% 透明度过渡到 `bg-primary`）
- 时间戳改用 `font-mono tabular-nums`（Geist Mono 对齐数字）
- 条目的 hover 状态增强：`hover:border-border-light` 过渡
- 空状态（无历史记录时）：从纯文本改为虚线边框卡片（`border-dashed border-border-light rounded-lg`），包含主文本 "暂无评估历史" + 辅助提示 "完成评估后，报告将自动保存在此处"

**约束：**
- 不修改 EvaluationHistory 的 props 签名或 store 导入
- 内容为静态内联，不引入外部数据源或国际化

## Acceptance criteria

- [x] 右侧面板显示三个卡片：评估指南、历史评估、写作小贴士
- [x] 评估指南包含 3 条输入建议
- [x] 历史评估卡片显示历史条数角标，渲染 EvaluationHistory 组件
- [x] 写作小贴士包含 2-3 条网文写作建议
- [x] EvaluationHistory 条目左侧有圆点指示器，hover 时变色
- [x] 时间戳以 Geist Mono（`font-mono tabular-nums`）渲染
- [x] 空历史状态显示虚线边框卡片 + 提示文本
- [x] 所有现有 EvaluationHistory 测试通过（9/9）
- [x] 所有现有 EvaluatePage 测试通过（9/9）

## Blocked by

p1-011-01（需要双栏布局承载右侧面板）
