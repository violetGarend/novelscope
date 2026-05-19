# Issue #12: Golden Sample 验证

## What to build

在启用 LLM 评估前，用 3-5 个已知质量等级的中文网文章节样本跑 3 轮评估，验证 LLM 输出的分数稳定性和 Prompt 质量。输出验证报告，确认 Prompt 可用。

## Acceptance criteria

- [ ] 准备 3-5 个不同长度（500/2000/5000 字）的中文网文章节 Golden Sample
- [ ] 每个样本附带人工预期的评分范围（爽点密度/节奏/注水大致等级）
- [ ] 对每个样本跑 3 轮评估，记录所有分数
- [ ] 同一样本多次评估方差 < 0.5 分（一致性要求）
- [ ] LLM 评分与人工预期偏差在合理范围内
- [ ] 记录 Prompt 改进点（如有），迭代直至输出质量可接受
- [ ] 输出 Golden Sample 验证报告，作为 `docs/golden-sample-report.md`
- [ ] Pipeline golden test：将 Golden Sample 评估逻辑固化为可重复运行的测试

## Blocked by

None - can start immediately（需要 DEEPSEEK_API_KEY）
