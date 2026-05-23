# Issue #p1-015: 记忆注入评估管线

## What to build

在评估管线中新增记忆检索和上下文注入步骤，使评估能感知前文角色和设定。

1. `backend/src/services/pipeline/memory-step.ts` — 记忆管线步骤：
   - 在规则引擎提取信号之后、LLM 评分之前插入
   - 将当前章节文本转为嵌入 → 查询 pgvector 获取 top-5 相关角色 + top-5 相关设定
   - 格式化为结构化上下文文本：`## 已有角色\n{name}: {traits}...\n## 已有设定\n{key}: {value}...`
2. `backend/src/services/prompt/index.ts` 扩展 — 记忆上下文注入：
   - `buildEvaluationPrompt()` 接受可选 `memoryContext` 参数
   - 当有记忆上下文时，在 prompt 中新增"已有故事上下文"section
   - 包含"请检查本章对已有角色和设定的描写是否一致"指令
   - 记忆上下文为空时不影响现有 prompt 结构（向后兼容）
3. `backend/src/services/pipeline/index.ts` 修改 — 管线编排：
   - 新增 `memory-context` 步骤（编号 step 2.5，在 signal-extraction 之后、llm-evaluation 之前）
   - 通过 PipelineDependencies 注入 memory 相关服务
   - 仅当 novelId 存在且有前文章节时才执行（第一章跳过）
4. `backend/src/services/memory/consistency-check.ts` — 一致性检查：
   - 在 LLM 响应中新增 `consistencyIssues` 字段
   - 格式：`{ type: "character"|"setting", entity: string, description: string, severity: "warning"|"error" }`
   - 这是 LLM 产出的结构化警告，非规则引擎硬判定

## Acceptance criteria

- [ ] 评估第 2+ 章时 prompt 包含前文章节提取的角色/设定上下文
- [ ] 评估第 1 章时 prompt 不含记忆上下文（不报错）
- [ ] 记忆步骤在规则引擎信号提取之后、LLM 评分之前执行
- [ ] pgvector 检索延迟 < 100ms
- [ ] 一致性检查结果在 LLM 响应的 consistencyIssues 字段中返回
- [ ] 后端测试：记忆上下文格式化、管线步骤执行顺序、第一章跳过逻辑，约 6 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

- p1-014: 实体提取 + 本地嵌入（需要 pgvector 中有数据可检索）
- p1-006: 持久化服务（需要 Novel/Chapter 关联）
