# NovelScope — 小说望远镜

AI 驱动的中文网文质量评估与商业化辅助平台。

## 功能

- **追读力分析** — Hook 强度、爽点密度、章末悬念、节奏评分
- **节奏曲线** — 可视化全章张力变化（纯 SVG）
- **注水检测** — 段落相似度分析、重复句式识别
- **一致性检查** — 逻辑矛盾检测
- **改进建议** — 建设性语气，亮点优先

## 技术栈

| 层级 | 选型 |
|------|------|
| 前端 | Next.js + TypeScript + Tailwind CSS |
| 后端 | Next.js API Routes |
| 数据库 | PostgreSQL + Prisma 7 |
| LLM | DeepSeek API（通过 openai npm） |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 DATABASE_URL 和 DEEPSEEK_API_KEY

# 启动前后端（前端 :3000，后端 :3001）
npm run dev
```

## 项目结构

```
├── frontend/          # Next.js 前端
│   └── src/
│       ├── app/       # 页面路由
│       ├── components/# UI 组件
│       ├── lib/       # 工具函数
│       └── types/     # 类型定义
├── backend/           # Next.js API 服务
│   └── src/
│       ├── app/api/   # API 路由
│       ├── lib/       # Prisma 客户端等
│       └── services/  # 业务逻辑
├── docs/              # 文档
└── DESIGN.md          # 设计系统
```

## 当前阶段

Phase 0（验证期）— 构建追读力评估原型，验证作者付费意愿。
