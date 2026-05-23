# Issue #p1-020: 报告分享链接

## What to build

评估报告只读分享链接：生成 shareToken + 公开查看页面 + 分享管理。

1. `backend/src/app/api/reports/[id]/share/route.ts` — 分享管理 API（受 requireAuth 保护）：
   - `POST` — 生成 shareToken（UUID v4），写入 EvaluationReport.shareToken 字段，返回完整分享 URL
   - `DELETE` — 清除 shareToken（设为 null），取消分享
   - 仅报告所有者可操作
2. `backend/src/app/api/reports/share/[token]/route.ts` — 公开查看 API（无需认证）：
   - `GET` — 根据 shareToken 查找报告
   - 返回只读报告：过滤掉 `tokenUsage`、`costEstimate`、`rawLLMResponse` 等敏感字段
   - token 不存在或已取消 → 404 + "该分享链接已失效"
3. `frontend/src/app/share/[token]/page.tsx` — 公开分享页：
   - 无需登录，独立布局（无导航栏、无侧边栏）
   - 顶部：NovelScope Logo + "评估报告"标题
   - 报告内容复用 ReportCard（只读模式：无编辑/删除/分享按钮）
   - 底部："由 NovelScope 生成 — 智能网文评估工具" + 引导注册链接
4. `frontend/src/components/ShareButton.tsx` — 分享按钮：
   - 评估完成后在 ReportCard 中显示分享按钮
   - 点击 → 调用 `POST /api/reports/:id/share` → 显示分享 URL + "复制链接"按钮
   - 已生成分享时显示"取消分享"按钮
   - 复制成功后 toast 提示"链接已复制到剪贴板"
5. Prisma schema：EvaluationReport 新增 `shareToken String? @unique` 字段

## Acceptance criteria

- [ ] POST 成功生成唯一 shareToken 并返回分享 URL
- [ ] DELETE 成功清除 shareToken，之后访问返回 404
- [ ] 公开分享页无需登录即可访问
- [ ] 分享报告不包含 tokenUsage、costEstimate、rawLLMResponse
- [ ] 已取消的分享链接访问时显示"该分享链接已失效"
- [ ] 复制链接按钮功能正常 + toast 提示
- [ ] 分享页底部有引导注册链接
- [ ] Prisma migration 成功添加 shareToken 字段
- [ ] 后端测试：生成/取消/公开访问/404，约 6 个测试
- [ ] 前端测试：分享按钮交互、公开页面渲染，约 4 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

- p1-006: 持久化服务（需要 EvaluationReport 存储层）
