# Issue #p1-011: 用户模型扩展 + JWT 认证服务

## What to build

在现有 Prisma User 模型基础上扩展字段，实现完整的 email/password 注册登录 JWT 认证服务。

**Prisma 变更**：User 模型新增 `passwordHash`（可选，OAuth 用户为 null）、`oauthProvider`、`oauthId`、`plan`（默认 "free"）、`quotaUsed`（默认 0）、`quotaLimit`（默认 10）。

**后端服务**：
1. `backend/src/lib/auth.ts` — 使用 `jose` 库实现 JWT access token（15 分钟过期）和 refresh token（7 天过期）的签发/验证
2. `backend/src/services/auth/register.ts` — 邮箱注册：校验 email 格式 + 密码强度（>= 8 字符），bcryptjs 哈希，创建 User 记录，返回 access token + 设置 refresh token httpOnly cookie
3. `backend/src/services/auth/login.ts` — 邮箱登录：验证密码，返回双 token
4. `backend/src/services/auth/refresh.ts` — 校验 refresh token cookie，签发新 access token
5. `backend/src/services/auth/logout.ts` — 清除 refresh token cookie

**API 路由**：
- `POST /api/auth/register` — `{ email, password }` → `{ user, accessToken }` + Set-Cookie
- `POST /api/auth/login` — `{ email, password }` → `{ user, accessToken }` + Set-Cookie
- `POST /api/auth/refresh` — Cookie → `{ accessToken }`
- `POST /api/auth/logout` — 清除 cookie
- `GET /api/auth/me` — Bearer token → `{ user }`

## Acceptance criteria

- [x] 注册成功返回 access token + httpOnly refresh token cookie
- [x] 重复邮箱注册返回 409 错误 + 中文提示
- [x] 弱密码（< 8 字符）返回 400 错误
- [x] 登录成功/失败（错误密码/不存在用户）均有正确响应
- [x] refresh 有效 token → 新 access token；过期 token → 401
- [x] /api/auth/me 有效 token → 用户信息；无/过期 token → 401
- [x] 密码以 bcryptjs 哈希存储，不存明文
- [x] `npx prisma migrate` 成功执行，User 表新字段可用
- [x] 后端测试覆盖所有 API 路由（成功 + 错误路径），约 15 个测试
- [x] 已有 289 个测试全部通过（当前 443 个，后端 282 + 前端 161）

## Blocked by

None — can start immediately.
