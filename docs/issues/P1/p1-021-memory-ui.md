# Issue #p1-021: Memory 管理 UI

## What to build

前端 Memory 管理页面：角色和世界观设定的查看、编辑、合并。

1. `frontend/src/app/(dashboard)/memory/page.tsx` — Memory 管理主页：
   - 两个 Tab："角色档案" / "世界观设定"
   - 角色 Tab：卡片列表，每张卡片展示角色名、特征标签、角色定位、关联章节数
   - 设定 Tab：按类别（修炼体系/地理位置/势力分布/其他）分组的键值对列表
   - 每项显示最近更新时间
2. `frontend/src/components/MemoryPanel.tsx` — Memory 面板组件：
   - `CharacterCard`：角色名可编辑，特征标签可增删，角色定位下拉选择（主角/反派/配角/路人）
   - `SettingRow`：类别可改，key-value 可编辑，支持删除
   - "合并重复"按钮：选中两个角色 → 确认合并 → 调用 API
   - "删除"按钮：确认后删除实体
   - 空状态："还没有提取的角色/设定，完成首次评估后将自动提取"
3. API 路由（受 requireAuth 保护）：
   - `GET /api/memory/characters?novelId=` — 获取角色列表
   - `PUT /api/memory/characters/[id]` — 更新角色
   - `DELETE /api/memory/characters/[id]` — 删除角色
   - `POST /api/memory/characters/merge` — 合并两个角色 `{ sourceId, targetId }`
   - `GET /api/memory/settings?novelId=` — 获取设定列表
   - `PUT /api/memory/settings/[id]` — 更新设定
   - `DELETE /api/memory/settings/[id]` — 删除设定
4. 按 novelId 筛选：页面顶部下拉选择当前小说

## Acceptance criteria

- [ ] 角色卡片列表正确展示名称、特征、定位、关联章节数
- [ ] 设定列表正确按类别分组展示
- [ ] 角色名称可编辑，特征标签可增删
- [ ] 合并两个角色成功（source 合并到 target，source 删除）
- [ ] 删除实体后列表更新
- [ ] 空状态引导文字友好
- [ ] 按小说筛选功能正常
- [ ] 前端组件测试：角色卡片渲染、设定列表渲染、合并交互、空状态，约 8 个测试
- [ ] 已有 289 个测试全部通过

## Blocked by

- p1-019: 实体提取 + 本地嵌入（需要实体数据）
