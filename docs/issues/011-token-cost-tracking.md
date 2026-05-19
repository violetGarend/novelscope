# Issue #11: Token 用量 + 成本追踪

## What to build

当前 API 响应中 `tokenUsage` 和 `costEstimate` 始终为 `null`。从 LLM 响应中提取实际 token 用量，按 DeepSeek 定价计算成本，在 ReportCard 底部展示。

## Acceptance criteria

- [x] Pipeline 返回真实的 `tokenUsage`（prompt_tokens, completion_tokens）
- [x] 基于 DeepSeek 定价计算 `costEstimate`（¥1/百万输入 token, ¥2/百万输出 token）
- [x] ReportCard 底部展示 token 用量和成本（小字，不干扰主报告视觉层级）
- [x] 无 API Key 时仍返回 `null`，不报错
- [x] 后端测试：验证 token 提取和成本计算逻辑
- [x] 前端测试：验证 token/cost 渲染

## Blocked by

None - can start immediately
