# NovelScope Frontend

NovelScope（小说望远镜）前端 — AI 写作质量评估 SaaS 界面。

## 技术栈

- Next.js 16 + TypeScript
- Tailwind CSS（DESIGN.md 设计系统）
- Vitest + React Testing Library（测试）

## 快速启动

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

后端服务需在端口 3001 运行，或设置 `NEXT_PUBLIC_API_URL` 环境变量。

## 核心组件

| 组件 | 说明 |
|------|------|
| `EvaluatePage` | 评估主页面：输入框 + 进度条 + 报告卡片 + 历史列表 |
| `ProgressBar` | 7 步 SSR 进度条，含骨架屏加载态 |
| `ReportCard` | 完整报告：综合评分 + 子评分 + 亮点建议 + 一致性检查 |
| `ScoreBadge` | 颜色编码评分徽章（绿/黄/红） |
| `PacingCurve` | 纯 SVG 节奏曲线面积图（无第三方库） |
| `EvaluationHistory` | localStorage 评估历史列表（最近 10 条） |

## 测试

```bash
npm test
# 当前: 131 tests, 8 suites
```
