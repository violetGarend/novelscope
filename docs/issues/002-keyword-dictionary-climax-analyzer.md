# Issue #2: 关键词词典 + 爽点密度规则引擎

## What to build

构建爽点密度分析器（ClimaxAnalyzer），包含关键词词典和评分逻辑。通过独立的 API 端点暴露，前端可调用验证。

## Acceptance criteria

- [x] 关键词词典：5 类共 79 个关键词（反转/震撼/突破/冲突/情感）
- [x] ClimaxAnalyzer 函数：接收章节文本，输出 0-10 分 + 命中关键词列表
- [x] 评分逻辑：关键词命中密度 + 对话密度 + 每千字冲突事件计数
- [x] 临时 API 端点 POST /api/test/climax：输入文本，返回分析结果
- [x] Jest 单元测试：7 个测试（5 单元 + 2 API）全部通过
- [x] 边界测试：空文本、纯对话、超短文本

## Blocked by

- #1 Prisma Schema 扩展
