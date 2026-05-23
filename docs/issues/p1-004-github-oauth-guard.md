# Issue #p1-004: GitHub OAuth + 认证守卫

## What to build

在 p1-003 JWT 认证服务基础上，增加 GitHub OAuth 登录和路由级认证守卫。

**GitHub OAuth**：
1. `backend/src/services/auth/oauth.ts` — GitHub OAuth flow：
   - `GET /api/auth/github` — 构造 GitHub authorize URL（含 client_id、redirect_uri、state 防 CSRF），302 重定向
   - `GET /api/auth/github/callback` — 接收 code + state，校验 state → 用 code 换 access_token → 获取 GitHub 用户信息 → 查找或创建 User（oauthProvider="github"）→ 签发 JWT
2. 环境变量：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GITHUB_REDIRECT_URI`

**认证守卫**：
1. `backend/src/lib/auth-guard.ts` — `requireAuth(request)` 函数：从 Authorization header 提取 Bearer token → 验证 JWT → 返回 `{ userId, email }`；失败抛出 401
2. 路由在 handler 顶部调用 `requireAuth(request)` 即可保护

## Acceptance criteria

- [ ] 访问 `/api/auth/github` 302 重定向到 GitHub 授权页
- [ ] 授权回调成功创建/关联 User，返回 access token
- [ ] State 参数校验：CSRF 攻击者伪造回调 → 401
- [ ] 已有 GitHub 账号再次登录 → 复用已有 User 记录（不重复创建）
- [ ] `requireAuth()` 有效 token → 返回 userId + email
- [ ] `requireAuth()` 无效/过期/缺失 token → 401 + 中文提示
- [ ] 认证守卫可被路由 opt-in 使用（不影响已有公开路由）
- [ ] 后端测试覆盖 OAuth 回调 + 守卫逻辑，约 8 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

- p1-003: 用户模型扩展 + JWT 认证服务（需要 User 模型和 JWT 签发/验证基础设施）
