# Issue #p1-011: 校准 CLI + Golden Sample 自动回归

## What to build

校准工作流工具：CLI 脚本 + 自动回归 + 结构化报告。

1. `backend/src/services/calibration/runner.ts` — 校准运行器：
   - `runCalibration(samples, options)` — 遍历 golden samples，每样本运行 N 轮
   - 使用真实 LLM 调用（非 mock），分别测试 DeepSeek 和 Claude（如已配置）
   - 计算每样本的分数均值、标准差、是否在预期范围内
   - 统计全局指标：命中率、平均标准差、模型间分歧率
2. `backend/src/scripts/calibrate.ts` — CLI 校准工具：
   - `npx tsx src/scripts/calibrate.ts` 执行
   - 支持参数：`--model`（deepseek/claude/both）、`--rounds`（每样本轮数，默认 3）、`--sample`（仅跑指定样本）
   - 输出实时进度（当前样本 + 轮次 + 分数）
   - 自动生成 markdown 报告写入 `docs/calibration-report.md`
3. 校准报告内容：
   - 总览：命中率、平均标准差、模型分歧率
   - 每样本详情：预期范围、实际分数（每轮）、均值、标准差、是否命中
   - 与上次报告的对比（如有历史报告）
   - 未命中样本的诊断建议
4. 降级方案触发器：
   - 如果连续 3 次校准（3 轮 prompt 迭代后）仍不满足标准（>= 4/5 样本命中），则输出警告
   - 提示应启用回退方案：定量分数完全来自规则引擎，LLM 仅出定性分析

## Acceptance criteria

- [ ] `npx tsx src/scripts/calibrate.ts` 正常运行并输出进度
- [ ] 自动生成 `docs/calibration-report.md` 格式化报告
- [ ] 报告包含不少于以下内容：命中率、每样本详情、与上次对比
- [ ] 校准不通过时输出明确警告 + 回退方案提示
- [ ] 支持 --model / --rounds / --sample 参数
- [ ] 后端测试：校准运行器（mock LLM 响应验证统计计算），约 5 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

- p1-009: 校准版 Prompt v2（需要 prompt v2 作为被校准对象）
- p1-010: 多 Provider LLM 客户端（需要双模型支持）
