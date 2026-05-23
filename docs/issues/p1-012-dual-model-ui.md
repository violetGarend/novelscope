# Issue #p1-012: 双模型对比 UI — 雷达图双色叠加 + 分数差异标注

## What to build

前端展示 DeepSeek vs Claude 双模型评分对比：雷达图双色叠加 + 差异高亮 + 分歧警告。

1. `frontend/src/components/RadarChart.tsx` 扩展 — 双模型叠加显示：
   - 新 props：`scores: { deepseek: DimensionScores, claude?: DimensionScores }`
   - DeepSeek 用品牌色蓝色，Claude 用品牌色橙色
   - 两条多边形曲线同时渲染在同一雷达图上
   - 透明度处理确保重叠区域可辨识
   - Claude 未配置时仅显示 DeepSeek 单色（向后兼容）
2. `frontend/src/components/ReportCard.tsx` 扩展 — 双模型对比区块：
   - 新增"模型对比"区块，位于雷达图下方
   - 四维分数并列展示：DeepSeek 分数 | Claude 分数 | 差异值
   - 差异 > 2 的行高亮为黄色/红色背景 + "需人工判断"标签
   - `divergence: true` 时在区块顶部显示警告横幅
   - Claude 不可用时整个对比区块不渲染（不影响现有 UI）
3. `frontend/src/components/ModelBadge.tsx` — 模型标签组件：
   - 小标签显示模型名称（"DeepSeek" / "Claude"）+ 对应颜色圆点
   - 用于图例和分数表头
4. 颜色规范：
   - DeepSeek 蓝：`#3B82F6`
   - Claude 橙：`#F97316`
   - 分歧警告黄：`#F59E0B`
   - 需遵循 DESIGN.md 的色彩系统

## Acceptance criteria

- [ ] 双模型雷达图正确显示两条不同颜色的多边形曲线
- [ ] 单模型时雷达图仍正常显示（向后兼容）
- [ ] 四维分数差异表正确展示双模型分数 + 差异值
- [ ] 差异 > 2 的高亮行视觉上可辨识
- [ ] divergence 警告横幅在分歧时显示
- [ ] Claude 未配置时对比区块不渲染
- [ ] 颜色遵循 Tailwind 色板，与 DESIGN.md 一致
- [ ] 前端组件测试：双模型雷达图渲染、差异表渲染、分歧警告、单模型 fallback，约 8 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

- p1-010: 多 Provider LLM 客户端（需要双模型评分数据 schema）
