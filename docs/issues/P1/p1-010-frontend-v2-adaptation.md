# Issue #p1-010: 前端适配新数据结构 — 双模型雷达图 + 降级 UI

## Parent

[PRD: P1 规则引擎 v2 重构](../../prd/PRD-P1-规则引擎v2重构.md) — 模块 T5

## What to build

适配前端组件以渲染 p1-006 产出的 discriminated union 数据结构（complete/partial/degraded 三态），包括双模型叠加雷达图、分歧标记 UI、降级报告 UI。

### 完整态（complete）

- **RadarChart**：双多边形叠加渲染
  - DeepSeek #1E40AF 蓝实线（strokeWidth 2）+ 豆包 #7C3AED 紫虚线（strokeDasharray="6,4"）
  - 两条多边形同步从中心展开动画（150-250ms, ease-out）
  - 图例标注模型名称（Geist Mono 字体，与分数数字并列）
  - 色盲适配：颜色 + 线型双重编码
  - ARIA：`aria-label="四维雷达图，DeepSeek 评分和 豆包 评分叠加显示"`
- **分歧标记**：维度旁 ⚠ 图标 + hover tooltip（双方分数 + 差值），严格 > 2 触发
- **共识/分歧标签**："2 个 AI 评估一致" / "评估存在差异"
- **Token/成本**：双行展示（DeepSeek: X tokens / 豆包: Y tokens）

### 部分成功态（partial）

- 单模型雷达图 + 缺失模型标记文字（如"豆包 评估超时"）
- 黄色提示条："部分 AI 模型暂不可用，当前显示可用模型的评估结果"

### 降级态（degraded）

- 替换 LLM 区域（亮点/建议/雷达图）为 degrade-report 定性叙述
- 保留规则引擎数据区域（节奏曲线、注水检测、一致性）
- 顶部横幅："AI 服务暂不可用，以下为基于规则引擎的分析结果"
- 底部"重新评估"按钮

### 设计决策参考

共 18 项 UI 决策（D9-D26），详见 PRD 第七章。关键约束：
- 情感弧线保持"优势先行"顺序（亮点→建议→雷达图→规则数据）
- 加载态保持现有 7 步进度条
- 雷达图图例仅展示（不提供点击切换）
- 分歧阈值边界：差值恰好 2.0 视为一致
- 降级报告维持完整报告框架（标题/分段/卡片），非错误页风格
- Phase 0 仅桌面端 1024px+

## Acceptance criteria

- [ ] `frontend/src/types/evaluation.ts` 新建，定义 `EvaluationResult` discriminated union 类型
- [ ] ReportCard 根据 `status` 渲染三种不同 UI：
  - `complete` → 双模型雷达图 + 分歧标记 + 共识标签 + 双行 Token
  - `partial` → 单模型雷达图 + 缺失标记 + 黄色提示条
  - `degraded` → 定性文本 + 横幅 + 重试按钮
- [ ] RadarChart 支持双多边形叠加（不同颜色 + 线型）+ 同步展开动画
- [ ] 分歧标记维度显示 ⚠ 图标 + hover tooltip
- [ ] 色盲双重编码（颜色 + 线型）
- [ ] ARIA 语义标注
- [ ] 降级报告底部"重新评估"按钮触发完整评估
- [ ] ../../design/DESIGN.md 追加 2 个 color token（豆包 紫、Divergence 复用 warning 橙）
- [ ] 组件测试覆盖三态渲染 + 双多边形 + 分歧标记（约 25 个测试）
- [ ] 前端 131 个测试通过 + 新增约 25 个 = 约 156 个

## Blocked by

- p1-003（依赖 `*Features` 类型）
- p1-006（依赖三态 API 响应格式）
- p1-008（依赖 degrade-report 输出格式）
