# PRD: P1 产品化阶段 — 从原型到 SaaS

## Problem Statement

P0 阶段已交付核心评估管线（五大规则引擎 + LLM 信号注入 + SSE 流式评估），但当前系统存在三个根本问题阻止其成为可运营的产品：

1. **无用户身份** — 所有评估匿名进行，无法区分用户、追踪使用、提供个性化服务。作者刷新页面后仅靠 localStorage 找回历史，换设备即丢失。
2. **评分无区分度** — Golden sample 验证揭示 DeepSeek-v4-flash 对所有文本返回趋中评分（全 5.0），评估结果无法真正帮助作者判断章节质量优劣。
3. **无商业化闭环** — 原型可本地运行但无法产生收入。需要用户系统、用量配额、支付接入才能验证"作者是否愿意付费"的核心假设。

此外，P0 的 `.env.example` 文件含真实 API key 已提交 git 历史，存在安全风险需立即修复。

## Solution

将 NovelScope 从单用户本地原型转化为多用户 SaaS 产品，分 6 个阶段递进构建：

1. **安全修复 + 基础设施** — 轮换泄露的 API key，搭建 CI/CD，统一中间件
2. **用户系统** — 邮箱注册/登录 + GitHub OAuth + JWT 会话管理
3. **持久化** — 评估结果写入 PostgreSQL，小说/章节管理，服务端历史
4. **评分校准 + 多模型对比** — 修复趋中评分，增加 DeepSeek vs Claude 双模型对比
5. **向量记忆** — pgvector 角色/世界观嵌入，跨章节一致性注入
6. **扩展评估 + 报告分享** — 文风分析、AI 痕迹检测、题材热度 + 只读分享链接
7. **商业化** — 微信/支付宝支付、三级会员、用量配额

每个阶段独立可交付，后一阶段依赖前一阶段的基础能力。

## User Stories

### P1.0 — 安全修复 + 基础设施
1. 作为开发者，我希望泄露的 API key 被轮换且从 git 历史中清除，以便消除安全风险
2. 作为开发者，我希望 CI 流水线自动运行 lint + typecheck + test，以便每次提交都能验证代码质量
3. 作为开发者，我希望 CORS 配置集中在中间件中而非每个路由重复声明，以便维护方便
4. 作为开发者，我希望环境变量在启动时被校验，以便缺失配置时立即得到清晰错误而非运行时崩溃

### P1.1 — 用户系统
5. 作为网文作者，我希望用邮箱注册账号，以便保存我的评估历史和小说项目
6. 作为网文作者，我希望用邮箱+密码登录，以便在不同设备上访问我的数据
7. 作为网文作者，我希望用 GitHub 账号一键登录，以便省去填写注册表单的步骤
8. 作为网文作者，我希望登录状态在刷新页面后保持，以便不用每次重新登录
9. 作为网文作者，我希望看到自己的用户名和头像，以便确认已登录状态
10. 作为网文作者，我希望退出登录，以便在公共设备上保护隐私
11. 作为开发者，我希望未登录用户被重定向到登录页，以便保护用户数据安全
12. 作为开发者，我希望 API 路由支持认证守卫按需启用，以便公开路由（如分享页）无需登录

### P1.2 — 持久化
13. 作为网文作者，我希望评估完成后结果自动保存，以便不会丢失任何评估记录
14. 作为网文作者，我希望看到所有评估历史（按时间倒序），以便回顾和对比不同版本的改进
15. 作为网文作者，我希望创建小说项目并关联章节，以便按作品组织评估
16. 作为网文作者，我希望首次评估时自动创建小说和章节记录，以便无需手动设置即可开始
17. 作为网文作者，我希望点击历史记录查看完整的评估报告，以便回顾之前的分析结果
18. 作为网文作者，我希望已有的 localStorage 历史在首次登录后自动迁移到服务端，以便不丢失之前的评估
19. 作为网文作者，我希望按小说筛选评估历史，以便聚焦特定作品的分析

### P1.3 — LLM 评分校准 + 多模型对比
20. 作为网文作者，我希望评分能真正反映章节质量差异（而非什么都 5 分），以便评估结果有参考价值
21. 作为网文作者，我希望看到 DeepSeek 和 Claude 两个模型的评分对比，以便获得更可靠的评估
22. 作为网文作者，我希望当两个模型评分差异较大时收到提示，以便知道该章节可能需要人工判断
23. 作为开发者，我希望每次 prompt 变更后自动运行 golden sample 验证，以便检测评分质量是否退化
24. 作为开发者，我希望校准 CLI 工具产出结构化报告，以便追踪评分质量随时间的变化

### P1.4 — 向量记忆
25. 作为网文作者，我希望系统自动从章节中提取角色名称和特征，以便建立角色档案
26. 作为网文作者，我希望系统自动提取世界观设定（如修炼体系、地理位置），以便维护设定一致性
27. 作为网文作者，我希望在 Memory 页面查看和编辑已提取的角色和设定，以便纠正自动提取的错误
28. 作为网文作者，我希望评估后续章节时系统引用之前建立的角色和设定，以便检测一致性矛盾
29. 作为网文作者，我希望当新章节与之前设定冲突时收到一致性警告，以便及时修复逻辑漏洞
30. 作为网文作者，我希望看到角色在不同章节中的出场记录和特征变化，以便追踪角色发展

### P1.5 — 扩展评估 + 报告分享
31. 作为网文作者，我希望看到文风分析（句长分布、词汇丰富度、对话比例），以便了解自己的写作风格
32. 作为网文作者，我希望检测文本是否有 AI 生成的痕迹，以便确保作品的原创性
33. 作为网文作者，我希望了解自己作品的题材在市场上的竞争程度，以便做出商业化决策
34. 作为网文作者，我希望选择"基础评估"或"完整评估"，以便按需平衡评估深度和成本
35. 作为网文作者，我希望生成评估报告的只读分享链接，以便发给编辑或读者查看
36. 作为编辑，我希望通过分享链接查看作者的评估报告（无需注册），以便给出反馈
37. 作为网文作者，我希望随时取消已生成的分享链接，以便控制隐私
38. 作为网文作者，我希望分享页不显示 Token 用量和成本信息，以便保护商业敏感数据

### P1.6 — 商业化
39. 作为网文作者，我希望看到清晰的会员计划对比（免费/标准/专业），以便选择适合的方案
40. 作为网文作者，我希望用微信扫码支付升级会员，以便使用熟悉的支付方式
41. 作为网文作者，我希望用支付宝扫码支付升级会员，以便有支付选择
42. 作为网文作者，我希望看到本月剩余的评估次数，以便管理使用配额
43. 作为网文作者，我希望配额不足时收到友好提示和升级引导，以便了解如何继续使用
44. 作为免费用户，我希望每月有 10 次免费评估，以便在付费前充分体验产品
45. 作为付费用户，我希望付费后立即生效（无需等待审核），以便立即使用完整功能
46. 作为开发者，我希望支付回调经过签名验证，以便防止伪造支付通知

## Implementation Decisions

### 模块 1: 安全修复 + 基础设施

- API key 在 DeepSeek 控制台立即轮换，使用 `git filter-repo` 清除 git 历史
- CORS 统一处理：创建 Next.js Edge Middleware 统一注入 CORS 头，移除各路由的重复 OPTIONS handler
- 环境变量校验：Zod schema 校验所有必需环境变量，启动时 fail-fast
- CI：GitHub Actions 运行 lint + typecheck + test（前后端并行），PR 触发
- Pre-commit hook：扫描 staged files 中的 API key 格式模式，匹配则阻止提交
- `.env.example` 替换为纯占位符版本（如 `sk-your-api-key`）

### 模块 2: 用户系统

- 会话策略：JWT access token（客户端内存，不存 localStorage）+ refresh token（httpOnly cookie，7 天有效）。access token 过期 15 分钟
- JWT 库：`jose`（Edge Runtime 兼容，轻量）
- 密码哈希：`bcryptjs`（纯 JavaScript，无原生编译依赖）
- OAuth：原生 GitHub OAuth flow，无 NextAuth.js 依赖。回调 URL 从环境变量读取
- 认证守卫：路由级 helper 函数，路由处理函数顶部调用。不通过 Next.js 中间件（避免 Edge Runtime 限制）
- 前端认证状态：React Context (`AuthProvider`) + useReducer。access token 存 useRef（防 XSS），页面刷新时通过 `/api/auth/refresh` 静默恢复
- Prisma User 模型扩展：新增 `passwordHash`、`oauthProvider`、`oauthId`、`plan`、`quotaUsed`、`quotaLimit` 字段

API 契约：
- `POST /api/auth/register` — `{ email, password }` → `{ user, accessToken }` + Set-Cookie refreshToken
- `POST /api/auth/login` — `{ email, password }` → `{ user, accessToken }` + Set-Cookie refreshToken
- `POST /api/auth/refresh` — Cookie → `{ accessToken }`
- `POST /api/auth/logout` — 清除 refreshToken cookie
- `GET /api/auth/github` — 302 重定向到 GitHub OAuth
- `GET /api/auth/github/callback` — `{ code }` → `{ user, accessToken }` + Set-Cookie
- `GET /api/auth/me` — Bearer token → `{ user }`

### 模块 3: 持久化

- 评估完成时在同请求周期内写入 EvaluationReport 表（fire-and-forget：写入失败记录日志但不阻断用户响应）
- "零摩擦"创建：评估时若未提供 novelId，自动创建 Novel（标题取自文本前 20 字符）+ Chapter 记录
- localStorage 历史迁移：首次登录后检测 localStorage 中历史条目 → 提示用户是否导入 → 批量写入服务端
- 历史 API 分页：每页 20 条，支持按 novelId 筛选，按 createdAt 倒序
- Novel CRUD：title + genre（枚举：玄幻/都市/仙侠/科幻/历史/其他）
- Chapter 通过评估自动创建，number 自增

API 契约：
- `GET /api/novels` → `{ novels: Novel[] }`
- `POST /api/novels` — `{ title, genre }` → `{ novel }`
- `GET /api/novels/[id]` → `{ novel, chapters: Chapter[] }`
- `GET /api/chapters/[id]/reports` → `{ reports: EvaluationReport[] }`
- `GET /api/reports/[id]` → `{ report: EvaluationReport }`
- `GET /api/history?page=1&novelId=` → `{ entries: HistoryEntry[], total, hasMore }`

### 模块 4: LLM 评分校准 + 多模型对比

- Prompt v2 核心变更：
  - 每个维度 0/2/4/6/8/10 六个锚点，每个附带具体中文网文示例
  - 强制分布指令："至少一个维度分数 >= 8 或 <= 2"
  - 将规则引擎参考分数注入 prompt 作为锚点基准，LLM 可调整 ±3
  - 与参考文本对比而非绝对评分
- 多模型编排：
  - DeepSeek（主）+ Claude（辅），并行调用
  - Claude API key 可选：未配置时仅用 DeepSeek
  - 双模型分数差异 > 2 时标记为"分歧 — 需人工判断"
- 校准循环：
  - CLI 工具 `npx tsx src/scripts/calibrate.ts` 遍历 5 个 golden sample
  - 每样本运行 3 轮，计算分数标准差和预期范围命中率
  - 自动生成 markdown 报告写入 `../reports/calibration-report.md`
- 降级方案：如果 3 轮 prompt 迭代后仍无法满足校准标准（>= 4/5 样本命中预期范围），则回退方案生效 — 定量分数完全来自规则引擎，LLM 仅产出定性分析（highlights、suggestions、consistencyIssues）

LLM 响应 schema 扩展：
```typescript
// 新增字段
{
  styleAnalysis: { sentenceLengthMean, vocabularyRichness, dialogueRatio },
  aiDetection: { score: 0-10, indicators: string[] },
  genreClassification: { primary: string, confidence: number }
}
```

### 模块 5: 向量记忆

- 嵌入模型：`@xenova/transformers` + `bge-small-zh`（本地运行，零 API 成本，512 维向量）
- 向量存储：`pgvector` PostgreSQL 扩展（`CREATE EXTENSION vector`）
- VectorStore 接口抽象：
  ```typescript
  interface VectorStore {
    upsert(namespace: string, vectors: { id: string; embedding: number[]; metadata: Record<string, unknown> }[]): Promise<void>;
    query(namespace: string, embedding: number[], topK: number): Promise<{ id: string; score: number; metadata: Record<string, unknown> }[]>;
    delete(namespace: string, ids: string[]): Promise<void>;
  }
  ```
- 两阶段提取流程：
  - Phase A（评估时）：LLM 提取新角色 `{ name, traits, role }` 和新设定 `{ category, key, value }`，存入 CharacterProfile/SettingConstraint，生成嵌入写入 pgvector
  - Phase B（评估后）：用户在 Memory 页面审核、编辑、合并重复实体
- 一致性注入：评估第 N 章时，将章节文本转为嵌入 → 查询 pgvector 获取 top-5 相关角色 + top-5 相关设定 → 格式化为上下文注入 LLM prompt
- pgvector 命名空间：`novel:{novelId}:characters`、`novel:{novelId}:settings`

### 模块 6: 扩展评估

- 文风分析（纯规则引擎，无 LLM 依赖）：
  - 句长分布：均值、标准差、直方图（0-10字/11-20字/21-30字/31-50字/50+字）
  - 词汇丰富度：Type-Token Ratio (TTR)、Hapax Legomena 比例
  - 对话比例：对话行数 / 总行数
  - 段落熵：段落长度的信息熵
- AI 痕迹检测（混合方法）：
  - 统计层：GPT-isms 词典匹配（"在这个充满XX的世界里"、"然而"、"与此同时"、"值得注意的是"等 50+ 模式）
  - LLM 层：在评估 prompt 中追加 "To what extent does this text appear AI-generated?" 判断
  - 输出标记为"参考指标"而非"判定结果"
- 题材热度（P1 轻量版）：
  - 关键词题材分类：玄幻/都市/仙侠/科幻/历史/其他
  - 静态竞争度元数据（来自市场调研文档）：如"玄幻: 竞争激烈, 科幻: 蓝海"
  - 实时热度数据延后到 P2
- 评估类型选择：UI 下拉框 "基础追读力" / "完整评估（含文风+AI检测）"
- 完整评估仅对标准及以上会员开放

### 模块 7: 商业化

- 支付聚合：PayJS（payjs.cn），统一微信支付 + 支付宝 API，无需企业营业执照
- 会员计划：
  - 免费：10 次/月，仅基础评估，无记忆功能
  - 标准（¥29/月）：100 次/月，完整评估，记忆管理
  - 专业（¥99/月）：无限评估，完整评估，记忆管理，优先支持
- 支付流程：前端发起 → 后端创建 PayJS 订单（存储 Order 记录）→ 返回 QR 码 URL → 用户扫码 → PayJS 异步 webhook → 后端验签 → 更新 User.plan + quotaLimit → 前端轮询确认
- 配额检查：评估前检查 `quotaUsed < quotaLimit`。评估成功后 `quotaUsed += 1`。每月 1 日通过定时任务（或首次使用时惰性检查 `createdAt` 月份）重置
- 支付安全：PayJS webhook 签名验证（md5(token + data)），IP 白名单

API 契约：
- `POST /api/payment/create-order` — `{ plan: "standard"|"professional" }` → `{ orderId, qrCodeUrl }`
- `POST /api/payment/webhook` — PayJS 回调 → 200 OK（验签后更新用户计划）
- `GET /api/payment/status?orderId=` → `{ status: "pending"|"paid"|"expired" }`

### 模块 8: 报告分享

- 分享 token：UUID v4，存储为 EvaluationReport.shareToken（可空，唯一索引）
- 公开路由：`GET /api/reports/share/:token` — 无需认证，返回只读报告（过滤掉 tokenUsage、costEstimate、rawLLMResponse）
- 分享页：`/share/[token]` — 纯展示页面，无导航栏，ReportCard 只读模式
- 创建分享：`POST /api/reports/:id/share` — 生成 shareToken，返回分享 URL
- 取消分享：`DELETE /api/reports/:id/share` — 清除 shareToken

### 前端路由架构

```
/                          → 未登录: 落地页（介绍+引导注册）；已登录: 重定向到 /dashboard
/(auth)/login              → 登录页
/(auth)/register           → 注册页
/(dashboard)               → 受保护布局（侧边栏 + 顶栏）
/(dashboard)/page          → 评估主页（EvaluatePage）
/(dashboard)/novels        → 小说列表
/(dashboard)/novels/[id]   → 小说详情 + 章节列表
/(dashboard)/history       → 评估历史（分页表格）
/(dashboard)/memory        → Memory 管理（角色 + 设定）
/(dashboard)/pricing       → 定价页
/(dashboard)/settings      → 账号设置
/share/[token]             → 公开分享报告（无需登录）
```

### 数据流变更

P0 流程（当前）：
```
用户输入文本 → 规则引擎提取信号 → prompt 构建 → LLM 评分 → 直接返回 JSON → localStorage 存储
```

P1 流程（变更后）：
```
认证用户输入文本 → 配额检查 → 规则引擎提取信号
  → 查询 pgvector 获取记忆上下文 → prompt 构建（含锚点+记忆）
  → 双模型并行评分（DeepSeek + Claude）→ 分数合并 + 分歧检测
  → 扩展管线（文风/AI检测/题材）
  → DB 持久化（Novel/Chapter/Report）→ 返回完整 JSON
  → 前端展示双模型对比 + 扩展分析区块
```

## Testing Decisions

**测试原则**（继承 P0）：只测外部行为，不测实现细节。测试回答"模块是否做了它承诺的事"，而非"模块内部怎么做的"。

**测试框架**：后端 Jest (ts-jest) + 前端 Vitest (jsdom + @testing-library/react)

**需测试的模块及策略**：

| 模块 | 测试类型 | 覆盖内容 |
|------|----------|----------|
| Auth 服务 | 单元 + 集成 | 注册（成功/重复邮箱/弱密码）、登录（成功/错误密码/不存在用户）、refresh（有效/过期/缺失）、me（有/无/过期 token）、OAuth 回调 |
| Auth UI | 组件测试 | AuthProvider 状态流转、登录/注册表单提交/错误提示、受保护路由重定向 |
| Storage 服务 | 单元 + 集成 | Novel CRUD、Chapter 自动创建、Report 写入、分页历史、localStorage 迁移 |
| Dashboard UI | 组件测试 | 小说列表渲染、历史表格分页/筛选、空状态 |
| LLM Multi-Provider | 单元测试 | 双模型并行调用、Claude fallback、mock API 错误处理、分歧检测逻辑 |
| Calibration | 集成测试 | Golden sample 运行器、分数方差检查、范围命中率、报告生成 |
| Prompt v2 | 快照测试 | Prompt 模板渲染、锚点注入、记忆上下文格式化 |
| Memory 服务 | 单元 + 集成 | 实体提取 schema 校验、嵌入生成、pgvector 查询、一致性注入 |
| Style Analyzer | 单元测试 | 句长分布（已知文本→预期分布）、TTR 计算、对话比例 |
| AI Detection | 单元测试 | GPT-isms 匹配率（已知 AI 文本 vs 已知人工文本）、LLM 辅助判断 |
| Payment 服务 | 单元 + 集成 | 订单创建、webhook 验签、配额检查/扣减/重置、计划升级 |
| Payment UI | 组件测试 | 定价卡片渲染、支付弹窗、配额显示 |
| Share 服务 | 单元测试 | Token 生成/清除、公开路由认证豁免、敏感字段过滤 |
| Share UI | 组件测试 | 分享按钮、公开分享页渲染、非登录状态可访问 |
| RadarChart | 组件测试 | 双模型叠加渲染、颜色区分、分数差异标注 |
| ReportCard | 组件测试 | 双模型对比区块、文风分析区块、AI 检测标识、分享按钮状态 |

**Golden Sample 回归**（每次 prompt 变更后运行）：
- 5 个样本 × 3 轮
- 验收：>= 4/5 样本分数在预期范围内，标准差 >= 1.5
- 自动生成校准报告

**已有测试保护**：所有新功能开发期间，289 个已有测试必须持续通过。CI 流水线在每次推送时自动运行全量测试。

## Out of Scope

以下功能明确不在 P1 范围内：

- AI 文本生成（续写、扩写、润色）— 产品定位为分析工具，非生成工具
- 移动端/响应式适配 — P1 仍桌面端 ≥1024px
- 实时题材热度数据（需外部 API 或爬虫）
- 团队/协作功能（多用户共享小说项目）
- 暗色模式 — ../design/DESIGN.md 已定义但 P1 不实现
- Python 微服务拆分 — Phase 2+ 按需
- 内容审核（涉黄涉政检测）— 依赖第三方安全策略
- 多语言支持 — 仅中文
- Vercel/线上部署 — P1 仍本地运行，P2 部署

## Further Notes

### 核心假设验证
P1 的核心目标是验证 P0 PRD 中的 Go/No-Go 标准：**作者是否愿意为质量评估工具付费（29 元/月）？** P1.6 商业化上线后，需要收集以下数据判断是否进入 Phase 2：
- 免费→付费转化率（目标 > 5%）
- 付费用户月留存率（目标 > 60%）
- 平均每用户月评估次数
- NPS 评分

### 技术风险
1. **pgvector 冷启动** — `@xenova/transformers` 首次运行时需下载模型（约 300MB），需在部署文档中说明
2. **PayJS 依赖** — 第三方支付聚合服务，需关注其服务稳定性。代码中抽象支付接口以便切换
3. **双模型成本** — DeepSeek + Claude 并行调用使每次评估成本翻倍，需监控并与配额策略协调

### 产品定位重申
NovelScope 是"分析辅助工具"而非"AI 自动生成工具"。所有功能设计遵循这一原则：
- AI 痕迹检测帮助作者确保原创性，而非鼓励 AI 代写
- 向量记忆帮助作者追踪自己的设定，而非自动生成设定
- 评分帮助作者定位改进方向，而非替代编辑判断
