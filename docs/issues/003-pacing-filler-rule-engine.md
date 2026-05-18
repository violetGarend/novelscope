# Issue #3: 节奏分析 + 注水检测规则引擎

## What to build

构建节奏分析器（PacingAnalyzer）和注水检测器（FillerDetector）。通过独立 API 端点暴露，前端可调用验证。

## Acceptance criteria

- [ ] PacingAnalyzer：段落分类（动作/对话/描写）、段落长度变异系数(CV)、动作:对话:描写比例评分
- [ ] PacingAnalyzer 输出：0-10 分 + 节奏曲线数据 `[{paragraph, tension, type}]`
- [ ] FillerDetector：段落相似度计算（字符串相似度）、重复句式检测
- [ ] FillerDetector 输出：问题段落列表 + 建议
- [ ] 临时 API 端点 POST /api/test/pacing：输入文本，返回节奏分析结果
- [ ] 临时 API 端点 POST /api/test/filler：输入文本，返回注水检测结果
- [ ] Jest 单元测试：各 3 个 golden sample
- [ ] 边界测试：纯动作文本、纯对话文本、极短段落

## Blocked by

- #1 Prisma Schema 扩展
