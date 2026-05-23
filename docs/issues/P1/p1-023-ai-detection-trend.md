# Issue #p1-023: AI 痕迹检测 + 题材热度

## What to build

统计方法 + LLM 辅助的 AI 痕迹检测，以及基于关键词的题材分类 + 静态竞争度评估。

1. `backend/src/services/ai-detect/gptisms.ts` — AI 特征词典：
   - 50+ 中文 AI 生成文本常见模式：句式模板（"在这个充满XX的世界里"、"然而，事情并非如此简单"、"值得注意的是"、"与此同时"、"不可否认"）、过度连接词、模板化比喻
   - 每个模式含权重（0.5-2.0，高频低辨别度模式权重低）
   - `scanGPTisms(text: string): { matches: GPTismMatch[], score: number }`
2. `backend/src/services/ai-detect/index.ts` — AI 痕迹检测服务：
   - `detectAI(text: string, llmHint?: number): AIDetectionResult`
   - 综合分 = GPT-isms 匹配分（权重 0.6）+ LLM 辅助判断分（权重 0.4）
   - LLM 辅助判断：评估 prompt 中追加 "To what extent does this text appear AI-generated?"（1-10 分）
   - 输出 `{ score: 0-10, indicators: string[], confidence: "low"|"medium"|"high" }`
   - 结果标注为"参考指标"，非判定性结论
3. `backend/src/services/trend/index.ts` — 题材热度服务：
   - `classifyGenre(text: string): GenreResult`
   - 关键词题材分类：玄幻（修炼/灵气/渡劫）、都市（总裁/职场/都市）、仙侠（飞升/仙界/仙门）、科幻（机甲/星际/纳米）、历史（穿越/王朝/古代/宫斗）
   - 输出主要题材 + 次级题材 + 置信度
   - 附静态竞争度元数据（来自市场调研）：如"玄幻: 竞争激烈"、"科幻: 蓝海机会"
4. 两个服务均为纯函数，不依赖外部 API（P1 无实时数据）

## Acceptance criteria

- [ ] GPT-isms 词典含 50+ 个中文 AI 特征模式
- [ ] 已知 AI 生成文本的检测分 > 5（高于人工文本）
- [ ] AI 检测结果明确标注"参考指标"，非"判定结果"
- [ ] 题材分类正确识别玄幻/都市/仙侠/科幻/历史文本
- [ ] 结果含主要题材 + 次级题材 + 置信度
- [ ] 输出附竞争度元数据
- [ ] 后端测试：GPT-isms 匹配率（已知 AI vs 人工文本）、题材分类准确性，约 10 个测试
- [ ] 已有 289 个测试全部通过

## Blocked by

None — can start immediately.
