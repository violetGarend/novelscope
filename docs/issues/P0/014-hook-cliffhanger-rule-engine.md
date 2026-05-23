# Issue #14: Hook + Cliffhanger 规则引擎兜底

## What to build

当前 LLM 失败时，hookScore 和 cliffhangerScore 降级为 0。0 分在语义上是"极差"，但实际含义是"未知"——这对作者的打击是毁灭性的，且信息是错的。

为 Hook 和 Cliffhanger 各构建轻量规则引擎，LLM 失败时使用规则引擎参考分替代 0，前端标注"AI 深度分析未完成"。

## Acceptance criteria

- [x] Hook 规则引擎：分析开头 3-5 段，检测悬念/冲突/疑问/金句，输出 0-10 参考分
- [x] Cliffhanger 规则引擎：分析末尾 3-5 段，检测悬念关键词/未解冲突/反转暗示/情绪钩子，输出 0-10 参考分
- [x] Pipeline 降级逻辑：LLM 失败时 hookScore/cliffhangerScore 使用规则引擎分（替代 0）
- [x] Pipeline 返回新增字段 `hookSource: "llm" | "rule"` 和 `cliffhangerSource: "llm" | "rule"`，标记分数来源
- [x] 前端 ScoreBadge：规则引擎兜底的维度显示"参考分"标签 + tooltip "AI 深度分析未完成，当前为规则引擎参考分"
- [x] 后端测试：Hook 规则引擎覆盖（高 Hook 文本 / 平淡开头 / 空文本）
- [x] 后端测试：Cliffhanger 规则引擎覆盖（强悬念结尾 / 平淡结尾 / 空文本）
- [x] 后端测试：Pipeline 降级路径中 hookSource/cliffhangerSource 为 "rule"
- [x] 前端测试：部分结果中 ScoreBadge 显示"参考分"标签

## Blocked by

None — 可独立启动
