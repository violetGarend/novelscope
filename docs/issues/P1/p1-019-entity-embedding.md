# Issue #p1-019: 实体提取 + 本地嵌入

## What to build

LLM 驱动的角色/世界观实体提取 + `@xenova/transformers` 本地嵌入生成。

1. `backend/src/services/memory/extractor.ts` — 实体提取器：
   - `extractEntities(chapterText, previousEntities)` — 用 LLM 从章节中提取新角色和设定
   - Prompt 设计：要求输出 JSON `{ characters: [{ name, traits, role }], settings: [{ category, key, value }] }`
   - 与已有实体去重：通过名称相似度匹配避免重复创建
   - 输出 schema 校验（Zod）
2. `backend/src/services/memory/embedder.ts` — 本地嵌入生成器：
   - 使用 `@xenova/transformers` + `bge-small-zh` 模型
   - `generateEmbedding(text: string): Promise<number[]>` — 输出 512 维向量
   - 首次调用时自动下载模型（约 300MB，一次性）
   - 懒加载：embedder 在首次使用时初始化，不影响启动速度
   - 线程安全：使用队列确保单次推理（Transformers.js 限制）
3. `backend/src/services/memory/pgvector-store.ts` 扩展 — 嵌入读写：
   - upsert 时自动调用 embedder 生成嵌入
   - 实现 VectorStore 接口的 upsert/query/delete
   - 命名空间：`novel:{novelId}:characters`、`novel:{novelId}:settings`
4. Prisma migration：CharacterProfile 和 SettingConstraint 新增 `embedding Unsupported("vector(512)")` 字段

## Acceptance criteria

- [ ] 实体提取 LLM prompt 正确引导模型输出结构化 JSON
- [ ] 提取的实体正确写入 CharacterProfile 和 SettingConstraint 表
- [ ] 同名实体去重（名称相等或 Jaccard 相似度 > 0.8）
- [ ] `@xenova/transformers` 成功加载 bge-small-zh 并生成 512 维向量
- [ ] 嵌入随实体一同写入 pgvector 字段
- [ ] pgvector 查询返回余弦相似度排序的 top-K 结果
- [ ] Prisma migration 成功添加 embedding 字段
- [ ] 后端测试：实体提取 schema 校验、去重逻辑、嵌入生成、pgvector 查询，约 10 个测试
- [ ] 已有 289 个测试全部通过

## Blocked by

- p1-018: pgvector 搭建 + VectorStore 接口抽象（需要 pgvector 基础设施和 VectorStore 接口）
