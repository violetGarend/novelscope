# Issue #p1-022: 文风分析规则引擎

## What to build

纯规则引擎实现的文风分析模块，无 LLM 依赖，所有计算本地完成。

`backend/src/services/style/index.ts` — `analyzeStyle(text: string): StyleResult`：

1. **句长分布**：
   - 按中文标点（。！？…）分句
   - 统计均值、标准差
   - 直方图分桶：0-10字 / 11-20字 / 21-30字 / 31-50字 / 50+字
2. **词汇丰富度**：
   - Type-Token Ratio (TTR)：唯一词数 / 总词数（用 jieba 或简单字符级 bigram）
   - Hapax Legomena 比例：仅出现一次的词占比
3. **对话比例**：对话行数（含「」""''） / 总段落数
4. **段落熵**：段落长度分布的信息熵（高熵 = 节奏多变）
5. 输出 `StyleResult`：`{ sentenceLength: { mean, stddev, histogram }, vocabulary: { ttr, hapaxRatio }, dialogueRatio: number, paragraphEntropy: number }`

## Acceptance criteria

- [ ] 句长分布计算正确（已知文本 → 预期分布）
- [ ] TTR 和 Hapax 比例计算正确
- [ ] 对话比例精确到小数点后 2 位
- [ ] 段落熵为 0-1 之间的值
- [ ] 纯对话文本（99% 对话）→ 对话比 > 0.9
- [ ] 纯描写文本（无对话）→ 对话比 = 0
- [ ] 后端测试覆盖所有输出字段 + 边界情况（空文本/纯对话/纯描写），约 10 个测试
- [ ] 已有 289 个测试全部通过

## Blocked by

None — can start immediately.
