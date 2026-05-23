# Issue #p1-007: 评估历史 API + localStorage 迁移

## What to build

服务端分页历史 API + 首次登录时将 localStorage 中的评估历史迁移到服务端。

1. `GET /api/history` — 分页评估历史 API（受 requireAuth 保护）：
   - Query 参数：`page`（默认 1）、`pageSize`（默认 20）、`novelId`（可选筛选）
   - 响应：`{ entries: HistoryEntry[], total: number, hasMore: boolean }`
   - HistoryEntry 含：reportId、novelTitle、chapterTitle、overallScore（取 LLM 分数或规则引擎综合分）、createdAt
   - 按 createdAt 倒序
2. `backend/src/services/storage/migration.ts` — localStorage 迁移服务：
   - `POST /api/history/migrate` 端点
   - 接收前端发送的 localStorage 历史条目数组
   - 批量写入 Novel + Chapter + EvaluationReport
   - 去重：相同文本内容的章节不重复创建
   - 返回迁移结果：`{ migrated: number, skipped: number }`
3. `frontend/src/lib/history-migration.ts` — 前端迁移逻辑：
   - 在 AuthProvider 登录成功后检查 localStorage 中是否有历史条目
   - 若有，弹窗询问用户"是否将本地评估历史导入到账号？"
   - 用户确认后调用 `POST /api/history/migrate`
   - 迁移成功后清除 localStorage 中的历史缓存
   - 用户拒绝则保留 localStorage（不强制）

## Acceptance criteria

- [ ] 分页历史 API 正确返回用户的所有评估记录（按时间倒序）
- [ ] 可通过 novelId 筛选特定小说的历史
- [ ] hasMore 正确指示是否还有更多页
- [ ] localStorage 迁移成功将历史条目写入服务端 DB
- [ ] 相同文本内容的章节不重复创建（去重）
- [ ] 迁移弹窗在首次登录时显示，用户可选择导入或跳过
- [ ] 迁移后 localStorage 中历史被清除
- [ ] 后端测试：分页 API（含边界/空结果）、迁移 API（含去重），约 8 个测试
- [ ] 前端测试：迁移弹窗交互，约 3 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

- p1-006: 持久化服务（需要 Novel/Chapter/Report 存储层）
