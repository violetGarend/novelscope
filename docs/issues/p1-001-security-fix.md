# Issue #p1-001: 安全修复 — API key 轮换 + git 历史清理 + env 校验

## What to build

当前 `.env.example` 文件包含真实 DeepSeek API key（`sk-your-deepseek-api-key`）且已提交到 git 历史。需要：

1. 在 DeepSeek 控制台轮换 API key（立即）
2. 使用 `git filter-repo` 清除 git 历史中所有提交的 API key
3. 将 `.env.example` 替换为占位符版本（`sk-your-deepseek-api-key`）
4. 创建 `backend/src/lib/env.ts` — Zod schema 校验所有必需环境变量，启动时 fail-fast
5. 添加 pre-commit hook（`lefthook` 或 `husky`）扫描 staged files 中的 API key 格式模式
6. 更新 `.gitignore` 确保 `.env*` 全部排除（已配置但需复查）

## Acceptance criteria

- [ ] DeepSeek 控制台中 API key 已轮换为新 key
- [ ] git 历史中不再包含旧 API key（`git log -p | grep sk-` 无结果）
- [ ] `.env.example` 仅含占位符，不含真实 key
- [ ] `backend/src/lib/env.ts` 在启动时校验 DATABASE_URL 和 DEEPSEEK_API_KEY，缺失时抛出清晰错误
- [ ] Pre-commit hook 检测到 API key 模式时阻止提交并给出提示
- [ ] 已有 281 个测试全部通过（无回归）

## Blocked by

None — can start immediately.
