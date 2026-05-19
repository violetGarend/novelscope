# NovelScope Backend

NovelScope（小说望远镜）后端服务 — AI 写作质量评估引擎。

## 技术栈

- Node.js + Express
- Prisma ORM + PostgreSQL
- DeepSeek API（LLM 评估）
- Jest（测试框架）

## 快速启动

```bash
npm install
# 复制环境变量文件并配置
cp .env.example .env   # 填写 DEEPSEEK_API_KEY 和 DATABASE_URL
# 数据库迁移
npx prisma migrate dev
# 启动开发服务器（端口 3001）
npm run dev
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/evaluate` | POST | 标准评估 |
| `/api/evaluate/stream` | POST | SSE 流式评估（7 步进度推送） |

## 测试

```bash
npm test
# 当前: 91 tests, 14 suites
```
