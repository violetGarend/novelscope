# Issue #13: LLM 阶段进度条细化 + 超时降级

## What to build

LLM 调用需要 3-10 秒，进度条步骤 4-5 在此期间卡住。为 LLM 等待阶段增加子步骤提示，并为 OpenAI client 添加超时配置，超时后触发降级到规则引擎结果。

## Acceptance criteria

- [ ] Pipeline 步骤 4-5 增加子步骤：「构建 AI 提示…」→「调用 AI 分析…」→「处理 AI 结果…」
- [ ] OpenAI client 添加 45s 超时配置（`timeout` 参数）
- [ ] 超时后 Pipeline 正常降级（`isPartial: true`），不抛异常
- [ ] 前端 ProgressBar 正确显示新增的子步骤
- [ ] 后端测试：超时降级路径覆盖
- [ ] 前端测试：子步骤渲染覆盖

## Blocked by

- #12 Golden Sample 验证（需要验证结果确认典型延迟数值）
