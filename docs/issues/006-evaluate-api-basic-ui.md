# Issue #6: POST /api/evaluate 端点 + 基础 UI

## What to build

构建评估 API 端点和前端基础交互：文本输入框、字数统计、评估按钮、结果展示（综合评分）。

## Acceptance criteria

- [ ] POST /api/evaluate：接收 `chapterText` (100-50000 字符)
- [ ] 输入验证：null/空→400, <100字→400, >50000字→400, 非中文→400
- [ ] 错误响应格式：`{ error: { code, message, details } }`
- [ ] 成功响应：完整评估报告 JSON（含 reportId, 各项分数, isPartial, tokenUsage, costEstimate）
- [ ] 评估结果通过 Prisma 写入 EvaluationReport 表
- [ ] 前端大文本输入框 + 实时字数统计 + "开始评估" 按钮
- [ ] 前端调用 /api/evaluate 并展示综合评分（大号数字 + 颜色编码）
- [ ] 基础错误处理：输入验证失败显示红色提示，API 超时显示重试按钮
- [ ] Jest 集成测试：输入验证（所有边界情况）、成功/失败响应格式

## Blocked by

- #5 LLM 一致性保障 + 评估管线编排
