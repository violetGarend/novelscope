# Issue #5: LLM 一致性保障 + 评估管线编排

## What to build

构建 LLM 一致性保障模块（ConsistencyGuard）和评估管线编排器（EvaluationPipeline）。将规则引擎和 LLM 评估并行执行，合并结果，处理部分失败。

## Acceptance criteria

- [ ] ConsistencyGuard：分数 clamp（负数→0, 超10→10）、综合分四舍五入到 1 位小数
- [ ] 方差预算：同一章节多次评估方差 < 0.5 分；超出写入结构化日志
- [ ] EvaluationPipeline：`Promise.all` 并行执行 Rule Engine（3 分析器）+ LLM（Hook + Cliffhanger + Consistency）
- [ ] 综合评分公式：`Hook × 0.3 + Climax × 0.3 + Cliffhanger × 0.25 + Pacing × 0.15`
- [ ] 部分评估：LLM 任一失败时标记 `isPartial: true`，仅返回 Rule Engine 结果
- [ ] Jest 集成测试：完整评估流程（mock LLM → 验证合并结果）、部分失败处理、评分计算正确性
- [ ] Golden sample 测试：3-5 个固定文本样本的快照对比

## Blocked by

- #2 关键词词典 + 爽点密度规则引擎
- #3 节奏分析 + 注水检测规则引擎
- #4 DeepSeek LLM Client
