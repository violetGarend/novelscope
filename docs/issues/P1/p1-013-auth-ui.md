# Issue #p1-013: 认证 UI — 登录/注册页 + AuthProvider + 受保护路由布局

## What to build

在已有的 `(auth)/` 和 `(dashboard)/` 路由组占位基础上，实现完整的认证前端。

1. `frontend/src/lib/auth-context.tsx` — AuthProvider：
   - React Context + useReducer 管理认证状态 `{ user, accessToken, isLoading }`
   - accessToken 存 useRef（不存 localStorage，防 XSS）
   - 页面刷新时通过 `POST /api/auth/refresh` 静默恢复会话（httpOnly cookie）
   - 导出 `useAuth()` hook 供组件使用
   - `login(email, password)` / `register(email, password)` / `logout()` 方法
2. `frontend/src/app/(auth)/login/page.tsx` — 登录页：
   - 邮箱 + 密码表单，Tailwind 样式
   - 表单验证（邮箱格式、密码非空）
   - 错误提示（中文，如"邮箱或密码错误"）
   - 底部链接"还没有账号？去注册"
   - 登录成功后 `router.push('/dashboard')`
3. `frontend/src/app/(auth)/register/page.tsx` — 注册页：
   - 邮箱 + 密码 + 确认密码表单
   - 密码强度提示（>= 8 字符）
   - 错误提示（如"该邮箱已注册"）
   - 底部链接"已有账号？去登录"
   - 注册成功后自动登录并跳转 /dashboard
4. `frontend/src/app/(dashboard)/layout.tsx` — 受保护布局：
   - 检查认证状态：未登录 → 重定向到 /login
   - 顶栏：Logo + 用户名显示 + 退出按钮
   - 侧边栏：导航链接（评估 / 小说 / 历史 / Memory / 定价 / 设置）
   - 加载态：居中 spinner
5. `frontend/src/app/layout.tsx` 包裹 AuthProvider

## Acceptance criteria

- [ ] 未登录用户访问 /dashboard 自动重定向到 /login
- [ ] 注册成功 → 自动登录 → 跳转 /dashboard
- [ ] 登录成功 → 跳转 /dashboard
- [ ] 登录失败显示中文错误提示
- [ ] 刷新页面后登录状态保持（通过 refresh token cookie）
- [ ] 退出登录后清除状态，重定向到 /login
- [ ] 顶栏显示当前用户名
- [ ] 侧边栏导航链接完整且可点击
- [ ] 前端组件测试：AuthProvider 状态流转、登录/注册表单提交/错误提示、受保护路由重定向，约 10 个测试
- [ ] 已有 289 个测试全部通过

## Blocked by

- p1-011: 用户模型扩展 + JWT 认证服务（需要 API 端点）
