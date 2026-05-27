# NovelScope Frontend — 小说望远镜前端

AI 驱动的中文网文写作质量评估平台前端。Next.js 16 + React 19 + Tailwind CSS 4。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 16.2.6 (Turbopack) |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4（设计系统详见 `docs/design/DESIGN.md`） |
| 测试 | Vitest 4 + Testing Library |
| Lint | ESLint 9 |

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 认证页面 (login/register)
│   ├── (dashboard)/        # 仪表盘页面
│   ├── globals.css         # 全局样式
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页 (评估页)
├── components/
│   ├── EvaluatePage.tsx    # 评估主页 (文本输入 + 进度条 + 报告)
│   ├── ProgressBar.tsx     # 7 步进度条 (SSE 驱动，支持动态步骤名)
│   ├── ReportCard.tsx      # 评估报告卡片 (V2: 双模型/部分降级/完全降级)
│   ├── PacingCurve.tsx     # 节奏曲线 SVG (三线 + 趋势虚线)
│   ├── RadarChart.tsx      # 四维雷达图 (支持双模型叠加 + 分歧标记)
│   ├── EvaluationHistory.tsx # 评估历史 (localStorage)
│   ├── ScoreBadge.tsx      # 分数徽章
│   └── historyStore.ts     # 历史记录持久化
├── hooks/                  # 自定义 Hooks
├── lib/
│   └── api.ts             # API 客户端
├── types/                  # TypeScript 类型定义
└── test-utils/             # 测试工具
```

## 核心组件

### EvaluatePage
评估主页面。四态切换：`idle`（文本输入）→ `evaluating`（进度条）→ `done`（报告展示）/ `error`（错误提示）。

### ProgressBar
7 步进度指示器，SSE 事件驱动。支持：
- 动态步骤名（如 "AI 分析中，请稍候…"、"DeepSeek 已完成，等待豆包"）
- 骨架屏加载态（步骤 0）
- 完成闪光动画

### ReportCard
V2 报告卡片，三态渲染：
- **complete** — 双模型结果合并，雷达图 + 亮点 + 建议 + 分歧标记 + 注水 + 节奏曲线
- **partial** — 单模型成功，黄色警告标记失败方
- **degraded** — 双模型失败，展示定性文本报告 + 重试按钮

### RadarChart
四维雷达图（Hook / 爽点密度 / 章末悬念 / 节奏评分）。双模型评估时叠加双多边形，分歧点 ⚠ 标记 + 色盲双重编码（形状 + 颜色）。

### PacingCurve
纯 SVG 节奏曲线，无第三方图表库。三线（动作/对话/描写）+ 趋势虚线 + 极值点保留 + 悬停详情。

## 认证

JWT 认证体系（p1-011）：
- **accessToken** — 15min 过期，Bearer header 传递
- **refreshToken** — 7d 过期，httpOnly cookie（SameSite=strict），自动刷新
- **路由保护** — (auth) 目录下的 login/register 页面

## 状态管理

- 无全局状态管理库，组件级 `useState` + `useRef`（AbortController）
- SSE 流式驱动评估进度和结果
- `localStorage` 持久化评估历史

## 开发

```bash
# 安装依赖
bun install

# 启动开发服务器 (端口 3000)
bun run dev

# 类型检查
bun run typecheck

# Lint
bun run lint

# 运行测试
bun run test

# 构建
bun run build
```

后端 API 运行在 `http://localhost:3001`，通过 `NEXT_PUBLIC_API_URL` 环境变量配置。

## 测试

**161 个测试** (Vitest + Testing Library)，覆盖全部核心组件：

| 组件 | 测试数 | 覆盖内容 |
|------|--------|----------|
| ProgressBar | 16 | 步骤渲染、动态步骤名、骨架屏、完成闪光、溢出 |
| ReportCard | 60+ | V2 三态 (complete/partial/degraded)、双模型合并、分歧标签、空/错误状态 |
| EvaluatePage | 25 | SSE 流处理、进度更新、错误/重试、AbortController |
| PacingCurve | 20+ | 空数据、单行、多行折线、趋势虚线、悬停交互 |
| RadarChart | 20+ | 单/双模型 SVG 多边形、色盲编码、divergence 标记 |
| EvaluationHistory | 10+ | localStorage 读写、空状态、选择回调 |

## 项目进度

Phase 1.2 交付完成，P1.3 推进中。

| 阶段 | 状态 | 内容 |
|------|------|------|
| P0 (验证期) | ✅ 17/17 | 规则引擎 → LLM 管线 → API → 前端展示 |
| P1.0 (规则引擎 v2) | ✅ 4/4 | 特征提取器、Prompt v2 锚点评分、校准 |
| P1.1 (双模型编排) | ✅ 6/6 | 双模型并行、分歧检测、降级报告、UI 适配 |
| P1.2 (用户系统) | ✅ 1/1 | JWT 认证 (register/login/logout/refresh/me) |
| P1.3+ | ▶ 进行中 | 配额、支付、记忆管理 |

## 相关文档

- `docs/design/DESIGN.md` — 设计系统（字体、颜色、间距）
- `docs/prd/PRD-P0-追读力评估原型.md` — P0 技术 PRD
- `docs/prd/PRD-P1-规则引擎v2重构.md` — P1 规则引擎重构 PRD
- `docs/issues/` — Issue 追踪（P0 / P1 分工）
