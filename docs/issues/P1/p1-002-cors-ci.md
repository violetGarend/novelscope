# Issue #p1-002: CORS 中间件统一 + CI 搭建

## What to build

当前每个 API 路由文件各自声明 OPTIONS handler 和 CORS_HEADERS import，存在大量重复代码。同时项目无 CI/CD 流水线。

1. 创建 `backend/src/middleware.ts` — Next.js Edge Middleware，统一注入 CORS 头到所有 API 路由
2. 移除所有路由文件中的 OPTIONS handler 和 CORS_HEADERS import
3. 创建 `.github/workflows/ci.yml` — GitHub Actions 流水线：
   - 并行运行前后端 lint
   - 并行运行前后端 typecheck
   - 并行运行前后端 test（Jest + Vitest）
   - 仅在 PR 和 main/dev 分支 push 时触发

## Acceptance criteria

- [x] 所有 API 路由移除 OPTIONS handler 和 CORS_HEADERS import
- [x] CORS 中间件正确处理 OPTIONS 预检请求（返回 204 + CORS 头）
- [x] CORS 中间件为所有非 OPTIONS 请求添加 CORS 头
- [x] CI 流水线在 PR 时自动运行 lint + typecheck + test
- [x] CI 流水线状态 badge 显示在 README 中
- [x] 已有 289 个测试全部通过

## Blocked by

None — can start immediately.
