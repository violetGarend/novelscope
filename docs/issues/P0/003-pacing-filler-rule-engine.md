# Issue #3: 节奏分析 + 注水检测规则引擎

## What to build

构建节奏分析器（PacingAnalyzer）和注水检测器（FillerDetector）。通过独立 API 端点暴露，前端可调用验证。

## Acceptance criteria

- [x] PacingAnalyzer：段落分类（动作/对话/描写）、段落长度变异系数(CV)、动作:对话:描写比例评分
- [x] PacingAnalyzer 输出：0-10 分 + 节奏曲线数据 `[{paragraph, tension, type}]`
- [x] FillerDetector：段落相似度计算（bigram 相似度）、重复段落检测
- [x] FillerDetector 输出：问题段落列表 + 建议
- [x] 临时 API 端点 POST /api/test/pacing：输入文本，返回节奏分析结果
- [x] 临时 API 端点 POST /api/test/filler：输入文本，返回注水检测结果
- [x] Jest 单元测试：PacingAnalyzer 5 个 + FillerDetector 3 个 + API 4 个
- [x] 边界测试：纯动作文本、纯对话文本、极短段落

## Blocked by

- #1 Prisma Schema 扩展
