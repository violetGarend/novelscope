# NovelScope — 小说望远镜

AI 驱动的中文网文写作质量评估平台。定位为"编辑之眼"——告诉作者**哪里有问题、为什么、怎么改**，而非 AI 自动生成工具。

![NovelScope 流程图](docs/novelscope流程图.png)

## 功能

- **追读力分析** — Hook 强度、爽点密度、章末悬念、节奏评分，四维雷达图
- **节奏曲线** — 可视化全章张力变化（纯 SVG，极值点保留）
- **注水检测** — bigram Jaccard 段落相似度分析
- **一致性检查** — 逻辑矛盾、角色声音一致性检测
- **改进建议** — 建设性语气，亮点优先，按严重度分级

## 技术栈

| 层级 | 选型 |
|------|------|
| 前端 | Next.js + TypeScript + Tailwind CSS |
| 后端 | Next.js API Routes（Phase 0 单服务） |
| 数据库 | PostgreSQL + Prisma ORM |
| LLM | DeepSeek-v4-flash（temperature=0，OpenAI SDK 兼容） |
| 部署 | Vercel（前端 + API Routes） |
| 测试 | Jest（后端）+ Vitest（前端） |

## 架构

```
Next.js API Routes (/api/evaluate, /api/evaluate/stream)
├── 阶段 1: 规则引擎信号提取（本地）
│   ├── 爽点密度 — 5 类 50+ 关键词 → 0-10 分
│   ├── 节奏分析 — 段落分类 + 张力曲线 + 降采样 → 0-10 分
│   └── 注水检测 — bigram Jaccard → 注水段落列表
├── 阶段 2: 信号注入 LLM prompt 构建
├── 阶段 3: LLM 评估（DeepSeek-v4-flash，45s 超时，1 次重试，指数退避）
├── 阶段 4: Guard（clamp [0,10] + 加权综合分）
└── 降级: LLM 失败 → 规则引擎参考分数
```

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 DATABASE_URL 和 DEEPSEEK_API_KEY

# 数据库迁移
cd backend && npx prisma generate && npx prisma db push

# 启动前后端（前端 :3000，后端 :3001）
cd backend && npm run dev
```

## 项目结构

```
├── frontend/              # Next.js 前端
│   └── src/
│       ├── app/           # 页面路由
│       ├── components/    # UI 组件（ProgressBar / ReportCard）
│       ├── lib/           # 工具函数
│       └── types/         # 类型定义
├── backend/               # Next.js API 服务
│   └── src/
│       ├── app/api/       # API 路由（evaluate / evaluate/stream）
│       ├── lib/           # Prisma 客户端、成本计算
│       ├── services/      # 业务逻辑
│       │   ├── climax/    # 爽点密度规则引擎
│       │   ├── pacing/    # 节奏分析规则引擎
│       │   ├── filler/    # 注水检测规则引擎
│       │   ├── llm/       # LLM Client（DeepSeek）
│       │   ├── prompt/    # Prompt 模板（信号注入）
│       │   ├── guard/     # 分数钳制 + 方差校验
│       │   ├── pipeline/  # 7 步评估管线编排
│       │   └── golden-sample/  # Golden Sample 验证
│       └── scripts/       # CLI 工具
├── docs/                  # 文档、设计、截图、Issue 追踪
├── DESIGN.md              # 设计系统
└── CLAUDE.md              # 项目开发指南
```

## 开发进度

**当前阶段**: Phase 0（验证期），核心评估管线已完整交付。

**已完成（12 个 Issue）：**

| # | 模块 | 说明 |
|---|------|------|
| #1 | Prisma Schema | 数据模型定义 |
| #2 | Climax 规则引擎 | 爽点密度检测，5 类 50+ 关键词 |
| #3 | Pacing 规则引擎 | 段落分类 + 张力曲线 + 降采样 |
| #4 | Filler 规则引擎 | bigram Jaccard 注水检测 |
| #5 | LLM Client | DeepSeek-v4-flash，45s 超时 + 重试 |
| #6 | Prompt 模板 | 信号注入架构 |
| #7 | Guard 一致性 | clamp + weighted sum + Golden Sample 方差校验 |
| #8 | Pipeline | 7 步评估管线 + LLM 失败优雅降级 |
| #9 | API 端点 | `/api/evaluate` + `/api/evaluate/stream` (SSE) |
| #10 | 前端 UI | ProgressBar（预热/收尾步骤）+ ReportCard + 节奏曲线 SVG |
| #11 | Token 用量 | LLMCallResult.usage + DeepSeek 定价计算 |
| #12 | Golden Sample | 5 样本 × 3 轮，方差 < 0.5，CLI runner |

**测试**: 234 个测试通过（后端 Jest 133 + 前端 Vitest 101）

**待实施（架构评审决策）：**
- 综合分 → 四维雷达图（P1）
- Hook + Cliffhanger 规则引擎兜底（P0）
- Pacing 降采样极值点保留（P2）
- Prompt 注入评分权重（P2）
- 5 个作者验证测试

## 评分规则

```
overallScore = hook × 0.3 + climax × 0.3 + cliffhanger × 0.25 + pacing × 0.15
```

- 所有子分数 clamp 在 [0, 10]，综合分四舍五入到 0.1
- temperature=0 确保确定性，Golden Sample 方差预算 < 0.5
- LLM 失败时：climax/pacing 使用规则引擎分，hook/cliffhanger 降级（待补规则引擎兜底）

## 文档

| 文档 | 说明 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | 项目开发指南（技术栈、模块、开发模式） |
| [DESIGN.md](DESIGN.md) | 设计系统（字体、颜色、间距） |
| [NovelScope-MVP设计文档.md](NovelScope-MVP设计文档.md) | MVP 设计文档（APPROVED） |
| [NovelScope-CEO审查报告.md](NovelScope-CEO审查报告.md) | CEO 级战略审查报告 |
| [AI小说创作平台-产品立项定义文档.md](AI小说创作平台-产品立项定义文档.md) | 产品立项文档 |
| [AI小说创作市场调研报告-三方验证版.md](AI小说创作市场调研报告-三方验证版.md) | 市场调研报告 |

## License

Private — 所有权利保留。
