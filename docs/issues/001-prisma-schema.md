# Issue #1: Prisma Schema 扩展

## What to build

扩展现有 Prisma schema，在 User/Project 基础上新增 Novel、Chapter、EvaluationReport 三张表。生成 Prisma Client 并验证 schema 语法正确。

## Acceptance criteria

- [x] Novel 模型：id, userId(FK→User), title, genre(enum: 玄幻/都市/仙侠/科幻/历史/其他), createdAt
- [x] Chapter 模型：id, novelId(FK→Novel), number(int), title, content(text), createdAt
- [x] EvaluationReport 模型：id, chapterId(FK→Chapter), hookScore, climaxDensity, cliffhangerScore, pacingScore, overallScore, consistencyIssues(JSON), pacingCurve(JSON), fillerDetection(JSON), isPartial(bool), rawLLMResponse(text), tokenUsage(int), costEstimate(float), createdAt
- [x] CharacterProfile 和 SettingConstraint 模型预定义（P0 不使用，Phase 2 启用）
- [x] `npx prisma generate` 成功
- [x] 所有关系（User→Novel→Chapter→EvaluationReport）正确配置

## Blocked by

None — can start immediately
