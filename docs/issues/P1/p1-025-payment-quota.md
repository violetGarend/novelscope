# Issue #p1-025: PayJS 支付 + 配额系统

## What to build

PayJS 支付聚合接入 + 用户配额检查/扣减/重置系统。

1. `backend/src/services/payment/payjs.ts` — PayJS 客户端：
   - `createOrder(userId, plan)` — 调用 PayJS 统一下单 API，返回 `{ orderId, qrCodeUrl }`
   - `verifyWebhook(data)` — md5 签名验证（md5(token + data)），防止伪造回调
   - `getOrderStatus(orderId)` — 查询订单状态
   - 支付接口抽象为 `PaymentProvider` interface（`createOrder` / `verifyWebhook` / `getStatus`），方便后续切换 Stripe
2. `backend/src/services/payment/quota.ts` — 配额服务：
   - `checkQuota(userId)` — 检查 `quotaUsed < quotaLimit`，返回 `{ allowed, remaining, limit }`
   - `incrementQuota(userId)` — 评估成功后 `quotaUsed += 1`
   - `resetMonthlyQuota()` — 每月 1 日重置所有用户 `quotaUsed = 0`（惰性检查：评估时检测 `createdAt` 月份与当前月份不同则重置）
3. API 路由：
   - `POST /api/payment/create-order`（受 requireAuth） — `{ plan }` → `{ orderId, qrCodeUrl }`
   - `POST /api/payment/webhook`（公开，PayJS 回调） — 验签 → 更新 User.plan + quotaLimit → 200 OK
   - `GET /api/payment/status?orderId=`（受 requireAuth） — `{ status: "pending"|"paid"|"expired" }`
4. 配额中间件：评估前在 `/api/evaluate` 中调用 `checkQuota`，不足时返回 402 + "本月评估次数已用完，请升级会员"
5. `backend/src/lib/auth-guard.ts` 扩展 — 添加可选的 `checkQuota` 中间件导出
6. Prisma schema：新增 Payment/Order 模型
   ```prisma
   model Order {
     id        String   @id @default(uuid())
     userId    String
     plan      String   // "standard" | "professional"
     amount    Int      // 分
     status    String   @default("pending") // pending | paid | expired
     payjsOrderId String? @unique
     createdAt DateTime @default(now())
     paidAt    DateTime?
   }
   ```

## Acceptance criteria

- [ ] 创建订单返回有效的 QR 码 URL
- [ ] Webhook 验签通过后正确更新用户计划 + 配额上限
- [ ] 验签失败返回 400（不更新用户状态）
- [ ] 配额不足时评估返回 402 + 中文提示
- [ ] 评估成功后配额 +1
- [ ] 跨月首次评估时配额自动重置
- [ ] 订单状态查询返回正确状态
- [ ] PaymentProvider 接口抽象清晰（方便日后切换 Stripe）
- [ ] Prisma migration 成功添加 Order 模型
- [ ] 后端测试：订单创建、webhook 验签、配额检查/扣减/重置、计划升级，约 12 个测试
- [ ] 已有 289 个测试全部通过

## Blocked by

- p1-012: GitHub OAuth + 认证守卫（需要 requireAuth）
