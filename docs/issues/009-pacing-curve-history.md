# Issue #9: 节奏曲线 SVG + 评估历史

## What to build

构建纯 SVG 节奏曲线面积图组件和基于 localStorage 的评估历史功能。

## Acceptance criteria

- [ ] 纯 SVG 面积图：无第三方图表库
- [ ] X 轴：段落序号；Y 轴：张力值 (0-10)
- [ ] 段落类型用颜色区分（动作/对话/描写）
- [ ] 鼠标悬停显示段落详情（张力值、类型、段落内容摘要）
- [ ] SVG 动画：使用 Design System motion 规范（曲线绘制动画）
- [ ] 评估历史：localStorage 存储，最近 10 条
- [ ] 历史列表：显示时间、综合评分、章节文本摘要
- [ ] 点击历史条目可查看完整报告
- [ ] 组件测试：SVG 渲染、历史读写、10 条上限截断

## Blocked by

- #6 POST /api/evaluate 端点 + 基础 UI
