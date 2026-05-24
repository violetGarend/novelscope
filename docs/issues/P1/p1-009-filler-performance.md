# Issue #p1-009: Filler O(n²) 性能优化

## Parent

[PRD: P1 规则引擎 v2 重构](../../prd/PRD-P1-规则引擎v2重构.md) — 模块 T7

## What to build

当前 filler 引擎的注水检测使用 bigram Jaccard 相似度做段落两两对比，复杂度 O(n²)。对于超长章节（> 200 段），性能急剧下降。在段落数超过阈值时截断到前 N 段做对比。

**变更：**
- `backend/src/services/filler/index.ts`：段落数 > 200 时仅取前 200 段做对比（O(n²) → O(200²)）
- 在返回结果中标记是否发生了截断（如 `truncated: true`）
- 不影响检测质量：注水检测主要关注重复模式，前 200 段已足够代表性

## Acceptance criteria

- [x] 段落数 > 200 时仅处理前 200 段
- [x] 返回结果包含 `truncated: boolean` 字段
- [x] 段落数 ≤ 200 时行为完全不变（无截断）
- [x] 已有 filler 测试全部通过
- [x] 性能测试：500 段章节处理时间从 O(n²) 降为 O(200²)（约 6 倍提升）

## Blocked by

None — can start immediately.
