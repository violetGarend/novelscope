# Issue #4: DeepSeek LLM Client

## What to build

构建 LLM 客户端模块，封装 DeepSeek API 调用、重试逻辑和结构化输出解析。

## Acceptance criteria

- [x] 使用 `openai` npm 包调用 DeepSeek API（OpenAI 兼容协议）
- [x] 所有调用强制 `temperature=0`
- [x] 指数退避重试：超时 1s→2s，429 错误 2s→4s，最多 2 次重试
- [x] 输出处理管线：strip markdown fences → JSON.parse (try-catch) → Zod schema 校验
- [x] Zod schema 定义：hookScore (0-10), climaxScore (0-10), cliffhangerScore (0-10), pacingScore (0-10), consistencyIssues (array), highlights (array), suggestions (array)
- [x] 失败时重试 1 次，仍失败则抛出可识别的错误类型
- [x] API Key 从环境变量 `DEEPSEEK_API_KEY` 读取
- [x] Jest 单元测试：Zod 校验（有效/无效输入）、重试逻辑（mock API）、markdown fence 清理、temperature=0 配置验证

## Blocked by

- #1 Prisma Schema 扩展
