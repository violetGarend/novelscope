# Issue #p1-013: pgvector 搭建 + VectorStore 接口抽象

## What to build

搭建 pgvector 基础设施，定义 VectorStore 抽象接口，实现 pgvector 实现。

1. PostgreSQL 扩展安装：`CREATE EXTENSION IF NOT EXISTS vector;`
2. `backend/src/services/memory/vector-store.ts` — VectorStore 接口：
```typescript
interface VectorStore {
  upsert(ns: string, vectors: { id: string; embedding: number[]; metadata: Record<string, unknown> }[]): Promise<void>;
  query(ns: string, embedding: number[], topK: number): Promise<{ id: string; score: number; metadata: Record<string, unknown> }[]>;
  delete(ns: string, ids: string[]): Promise<void>;
}
```
3. `backend/src/services/memory/pgvector-store.ts` — PgvectorStore 实现：
   - 使用 pgvector 的 `<=>` 余弦距离运算符
   - 命名空间通过表名前缀实现（`vectors_ns_xxx`）或通过 metadata 过滤
   - 批量 upsert 使用 `INSERT ... ON CONFLICT DO UPDATE`
4. Prisma schema 扩展：CharacterProfile 和 SettingConstraint 模型新增 `embedding Unsupported("vector(512)")` 字段
5. `backend/src/lib/db.ts` — 扩展 prisma 客户端导出，增加 raw SQL 查询辅助

## Acceptance criteria

- [ ] pgvector 扩展在 PostgreSQL 中成功安装
- [ ] VectorStore 接口定义清晰，包含 upsert/query/delete 三个方法
- [ ] PgvectorStore 实现通过集成测试：upsert 5 条向量 → query 返回 top-3 相似结果 → delete 后 query 不再返回
- [ ] 余弦相似度查询返回正确排序结果
- [ ] 向量维度 512（匹配 bge-small-zh）
- [ ] Prisma migration 生成成功（含 embedding 字段）
- [ ] 已有 281 个测试全部通过

## Blocked by

None — can start immediately.
