# Issue #p1-006: 双模型编排 + 降级路径

## Parent

[PRD: P1 规则引擎 v2 重构](../../prd/PRD-P1-规则引擎v2重构.md) — 模块 T3

## Condition

**p1-005 校准 CLI 必须 PASS 后才启动此 Issue。**

## What to build

将评估 pipeline 从单模型（DeepSeek）扩展为双模型并行编排（DeepSeek + 豆包），并实现完整的降级路径。

**核心变更：**

1. **参数化 LLM 客户端配置**：替代 Provider 接口抽象，改为 `{ model, baseURL, apiKey }` 参数化配置，从 env 配置列表取前两个有 API key 的模型
2. **Pipeline 双模型编排**：`Promise.allSettled` 并行调用两个模型，45s 超时保持不变
3. **三态结果**（Discriminated Union）：
   - **双双成功** → 分数合并 + 分歧检测 + 双模型数据返回 → `{ status: "complete" }`
   - **一成一败** → 使用成功方分数 + 日志记录失败 + 返回 `{ status: "partial", failedModel }`
   - **双双失败** → 调用 p1-008 的 degrade-report 服务生成定性报告 → `{ status: "degraded" }`
4. **截断协调循环**：`buildEvaluationPrompt` → 检测 `needsTruncation` → LLM 摘要压缩 → 重建 prompt → 重新评分（在 pipeline 层协调）
5. **纯模板 NLG 最终降级**：当 degrade-report 也失败时，使用纯模板 NLG 作为不可再降级的底层
6. **分歧处理**：取均值作为显示分数，前端展示双方分数

## Acceptance criteria

- [x] LLM 客户端支持参数化配置（model + baseURL + apiKey），不再使用 Provider 接口
- [x] Pipeline 从 env 读取两个模型配置并 `Promise.allSettled` 并行调用
- [x] 双成功路径：返回 `status: "complete"` + `DualModelScores` + 合并后的 features
- [x] 部分成功路径：返回 `status: "partial"` + 单模型分数 + `failedModel` 标识
- [x] 双双失败路径：返回 `status: "degraded"` + 定性报告文本
- [x] 特征截断时触发 LLM 摘要 → 重建 prompt 循环（最多 1 轮）
- [x] 45s 超时在双模型下各自独立计时
- [x] API 响应类型从单一 `EvaluationReport` 改为 discriminated union
- [x] Pipeline 单元测试：mock DI 覆盖三态 + 截断循环（18 个测试）
- [x] 后端测试全部通过（241 passed）

## Blocked by

- p1-003（依赖 `*Features` 类型）
- p1-004（依赖 Prompt v2）
- p1-005（Gate — 校准必须通过）
