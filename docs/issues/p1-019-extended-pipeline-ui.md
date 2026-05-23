# Issue #p1-019: 扩展评估管线集成 + UI 选择器

## What to build

将文风分析、AI 痕迹检测、题材热度集成到评估管线，前端增加评估类型选择器。

1. `backend/src/services/pipeline/index.ts` 修改 — 扩展管线步骤：
   - 在 LLM 评分之后新增可选步骤：`style-analysis`（规则引擎）、`ai-detection`（混合方法）、`genre-classification`（关键词）
   - 步骤执行由 `evaluationType` 参数控制：`"basic"` 仅追读力四维 + LLM 评分；`"full"` 额外包含文风 + AI 检测 + 题材
   - 扩展步骤失败不影响核心评估结果（fire-and-forget）
2. `backend/src/app/api/evaluate/route.ts` 修改：
   - 接受 `evaluationType?: "basic" | "full"` 参数，默认 "basic"
   - `"full"` 评估需检查配额（免费用户不可用，返回 402 Payment Required + 中文提示）
   - 响应 schema 扩展：新增 `styleAnalysis`、`aiDetection`、`genreClassification` 字段
3. `frontend/src/components/EvaluatePage.tsx` 修改 — 评估类型选择器：
   - 文本输入区上方新增下拉选择："基础追读力" / "完整评估（含文风+AI检测）"
   - 免费用户选择"完整评估"时 disabled + tooltip 提示"升级会员可用"
   - 完整评估时进度条显示额外步骤（文风分析 / AI 检测 / 题材分类）
4. `frontend/src/components/ReportCard.tsx` 扩展 — 新分析区块：
   - 文风分析区块：句长分布直方图 + TTR/对话比例/段落熵数值展示
   - AI 痕迹检测区块：分数 + 匹配到的 AI 特征模式列表 + "参考指标"标注
   - 题材分类区块：主要题材标签 + 竞争度说明
   - 仅在完整评估时展示这些区块

## Acceptance criteria

- [ ] 基础评估不包含文风/AI/题材分析
- [ ] 完整评估包含全部扩展分析
- [ ] 免费用户选择完整评估时收到升级提示
- [ ] 扩展步骤失败不影响核心评估结果
- [ ] 进度条正确反映额外步骤
- [ ] 文风分析直方图 + 数值在报告中正确展示
- [ ] AI 检测结果含"参考指标"标注
- [ ] 题材分类标签正确
- [ ] 后端测试：评估类型参数路由、管线步骤执行/跳过、扩展 schema 校验，约 8 个测试
- [ ] 前端测试：选择器交互、免费用户限制、报告新区块渲染，约 6 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

- p1-017: 文风分析规则引擎
- p1-018: AI 痕迹检测 + 题材热度
- p1-006: 持久化服务（需要配额检查基础设施）
