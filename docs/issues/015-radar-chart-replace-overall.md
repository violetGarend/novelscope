# Issue #15: 四维雷达图替换综合分

## What to build

当前 ReportCard 以 6xl 大号综合分 + 绿/黄/红颜色编码作为视觉主角，这制造了"考试成绩单"的用户体验，与 PRD 定义的"编辑的反馈"定位矛盾。

用纯 SVG 四维雷达图（Hook / Climax / Cliffhanger / Pacing）替换综合分，取消加权求和。每个维度独立展示，不做单一分数聚合。让作者看到"我的强项是什么、弱项是什么"，而不是"我得了 7.2 分"。

## Acceptance criteria

- [x] 纯 SVG 四维雷达图组件（4 轴，0-10 刻度，数据点连线围成多边形）
- [x] 每个轴端点标注维度名称 + 分数（如"Hook 7.2"）
- [x] 颜色编码按维度独立（不按综合分统一着色）
- [x] ReportCard 顶部：移除 `overallScore` 6xl 大字 + `ScoreBadge` 四联排，替换为雷达图
- [x] `guardScores()` 移除 `calculateOverall()` 加权求和（保留 clamp，每个分数独立返回）
- [x] `ValidatedScores` 移除 `overallScore` 字段
- [x] 前端类型、historyStore、测试 mock 同步移除 `overallScore`
- [x] 后端测试：验证 guardScores 不再返回 overallScore
- [x] 前端测试：雷达图渲染覆盖（4 轴标签、数据点、多边形）
- [x] 前端测试：ReportCard 不渲染综合分

## Blocked by

- #14 Hook + Cliffhanger 规则引擎兜底（确保雷达图四个维度在 LLM 失败时也有有效数据）
