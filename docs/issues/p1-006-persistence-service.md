# Issue #p1-006: 持久化服务 — Novel/Chapter/Report CRUD

## What to build

评估结果持久化到 PostgreSQL，小说/章节管理后端服务。

1. `backend/src/services/storage/novel-store.ts` — Novel CRUD：
   - `listNovels(userId)` — 用户的小说列表
   - `createNovel(userId, { title, genre })` — 创建小说
   - `getNovel(novelId)` — 小说详情（含章节列表）
   - `getOrCreateNovel(userId, title)` — 零摩擦创建（评估时自动调用）
2. `backend/src/services/storage/chapter-store.ts` — Chapter 管理：
   - `createChapter(novelId, { title, content, number })` — 创建章节（number 自增）
   - `getChapters(novelId)` — 小说下所有章节
3. `backend/src/services/storage/report-store.ts` — Report 管理：
   - `saveReport(chapterId, report)` — 保存评估报告
   - `getReportsByChapter(chapterId)` — 章节的所有评估报告
   - `getReport(reportId)` — 单个报告详情
4. API 路由（受 requireAuth 保护）：
   - `GET /api/novels` → `{ novels: Novel[] }`
   - `POST /api/novels` — `{ title, genre }` → `{ novel }`
   - `GET /api/novels/[id]` → `{ novel, chapters: Chapter[] }`
   - `GET /api/chapters/[id]/reports` → `{ reports: EvaluationReport[] }`
   - `GET /api/reports/[id]` → `{ report: EvaluationReport }`
5. `backend/src/app/api/evaluate/route.ts` 修改：评估完成后自动保存 EvaluationReport 到 DB（fire-and-forget，失败记日志不阻断响应）
6. 首次评估时自动创建 Novel + Chapter（零摩擦）

## Acceptance criteria

- [ ] Novel CRUD 全部操作正确读写数据库
- [ ] 评估完成时 EvaluationReport 自动写入 DB
- [ ] 首次评估自动创建 Novel（标题取文本前 20 字符）+ Chapter
- [ ] 未登录用户调用这些 API 返回 401
- [ ] 用户只能查看自己的小说和报告（权限隔离）
- [ ] 后端测试：Novel CRUD、Chapter 自动创建、Report 写入，约 12 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

- p1-004: GitHub OAuth + 认证守卫（需要 requireAuth）
