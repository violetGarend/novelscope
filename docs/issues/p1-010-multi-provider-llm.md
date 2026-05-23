# Issue #p1-010: 多 Provider LLM 客户端 — Claude 集成 + 双模型编排

## What to build

扩展 LLM 客户端支持多 provider，新增 Claude API 支持，实现双模型并行评分编排。

1. `backend/src/services/llm/anthropic-client.ts` — Claude API 客户端：
   - 使用 Anthropic SDK（`@anthropic-ai/sdk`）或原生 fetch + Messages API
   - 支持 `claude-sonnet-4-6`（默认）或可配置模型
   - 与 DeepSeek 客户端相同的接口签名（`evaluateWithLLM(text, prompt): Promise<LLMCallResult>`）
   - 内置超时（45s）+ 重试（1 次，指数退避）
2. `backend/src/services/llm/client.ts` 扩展 — `createMultiProviderClient(config)`：
   - 并行调用 DeepSeek + Claude
   - 使用 `Promise.allSettled` 处理部分失败（一个模型失败不影响另一个）
   - 双模型分数差异 > 2 时标记 `divergence: true`
   - Claude API key 可选：未配置时仅用 DeepSeek（与当前行为兼容）
3. LLM 响应 schema 扩展：新增 `{ scores: { deepseek: {...}, claude: {...} }, divergence: boolean }`

## Acceptance criteria

- [ ] Claude 客户端正确对接 Anthropic Messages API
- [ ] 双模型并行调用：DeepSeek 和 Claude 同时触发，等待双方完成
- [ ] Claude 失败（超时/API 错误）时不影响 DeepSeek 结果返回
- [ ] Claude 未配置时（无 ANTHROPIC_API_KEY 环境变量），自动降级为仅 DeepSeek
- [ ] 双模型分数差异 > 2 时 `divergence` 字段为 true
- [ ] Token 用量和成本统计包含两个模型（如有）
- [ ] 后端测试：mock 双 API 响应，覆盖并行成功/部分失败/全部失败/差异检测，约 12 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

None — can start immediately.
