# Issue #p1-009: 校准版 Prompt v2 — 评分锚点 + 强制分布

## What to build

DeepSeek-v4-flash 当前对所有文本返回趋中评分（全 5.0）。重新设计评估 prompt，引入评分锚点和强制分布指令。

**Prompt v2 核心变更**：
1. `backend/src/services/prompt/anchors.ts` — 每个维度定义 0/2/4/6/8/10 六个锚点级别，每个附带具体中文网文示例文本
2. `backend/src/services/prompt/index.ts` 重写 `buildEvaluationPrompt()`：
   - 注入锚点参考文本
   - 强制分布指令："请使用完整的 0-10 范围。至少一个维度的分数应 >= 8 或 <= 2"
   - 将规则引擎参考分数（climax/pacing/hook/cliffhanger）作为锚点注入，LLM 可在 ±3 范围内调整
   - 对比评分法："请将本章与以下参考文本对比后给出分数"
3. 新增 `backend/src/services/prompt/prompt-v2.ts` — 保留 v1 作为 fallback，可通过配置切换

## Acceptance criteria

- [ ] Prompt v2 包含 24 个锚点示例文本（4 维度 × 6 级别）
- [ ] 规则引擎分数作为锚点注入 prompt
- [ ] 强制分布指令在 prompt 中显式出现
- [ ] Prompt v1 和 v2 可通过配置切换（默认 v2）
- [ ] Prompt 快照测试更新
- [ ] 已有 281 个测试全部通过

## Blocked by

None — can start immediately.
