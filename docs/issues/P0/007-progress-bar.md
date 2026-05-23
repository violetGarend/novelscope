# Issue #7: 7 步进度条

## What to build

在评估过程中展示 7 步文本进度条，实时反馈评估进行到哪一步。

## Acceptance criteria

- [x] 7 步进度指示：正在验证文本 → 分析爽点密度 → 分析节奏 → 评估Hook强度 → 评估章末悬念 → 检查一致性 → 生成报告
- [x] 每步有对应的中文提示文字
- [x] 当前步骤高亮显示，已完成步骤显示完成状态
- [x] 加载状态：骨架屏占位
- [x] 进度条动画：使用 Design System 的 motion 规范（ease-out 进入，250-400ms）
- [x] 后端通过 SSE 或 WebSocket 推送进度（或前端轮询）
- [x] 组件测试：步骤切换逻辑、状态渲染

## Blocked by

- #6 POST /api/evaluate 端点 + 基础 UI
