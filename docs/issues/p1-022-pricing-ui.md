# Issue #p1-022: 定价 UI + 支付流程

## What to build

前端定价页面 + 支付 QR 码弹窗 + 配额显示。

1. `frontend/src/app/(dashboard)/pricing/page.tsx` — 定价页：
   - 三栏会员计划对比：免费 / 标准（¥29/月） / 专业（¥99/月）
   - 每栏列出：月评估次数、评估类型（基础/完整）、记忆管理、优先支持
   - 当前计划高亮 + "当前方案"标签
   - "升级"按钮（当前计划隐藏按钮，专业计划按钮 disabled + "已是最高级别"）
   - 免费用户显示"开始免费使用"而非"升级"
2. `frontend/src/components/PricingCard.tsx` — 定价卡片组件：
   - Props：`plan: Plan`（含 name、price、features、isCurrentPlan）
   - 渲染计划名称、价格（大字体）、功能列表（勾号图标）
   - 当前计划：绿色边框 + "当前方案"徽标
   - 推荐计划（标准）："推荐"徽标
3. `frontend/src/components/PaymentModal.tsx` — 支付弹窗：
   - 点击"升级"后弹出
   - 显示升级计划名称 + 价格
   - 展示 QR 码图片（从 PayJS 返回的 URL 加载）
   - 轮询订单状态（每 3 秒）直到 paid 或超时（5 分钟）
   - 支付成功 → 关闭弹窗 → 刷新用户状态 → toast "升级成功！"
   - 支付超时 → "支付超时，请重试" + 关闭按钮
   - 支持微信/支付宝 Tab 切换（PayJS 统一 QR 码，通常一个码支持两种支付方式）
4. `frontend/src/components/QuotaBadge.tsx` — 配额显示组件：
   - 在评估页顶栏显示：`剩余 5/10 次（免费版）`
   - 配额不足时变红 + 点击跳转定价页
   - 在 AuthContext 中维护 quotaUsed/quotaLimit 状态

## Acceptance criteria

- [ ] 三栏定价卡片正确展示免费/标准/专业计划
- [ ] 当前计划高亮显示
- [ ] 点击升级弹出支付 QR 码弹窗
- [ ] QR 码图片正确加载显示
- [ ] 支付状态轮询正常（pending → paid）
- [ ] 支付成功 toast + 刷新用户状态
- [ ] 支付超时有提示
- [ ] 配额徽标正确显示剩余次数
- [ ] 配额不足时变红并可跳转定价页
- [ ] 前端组件测试：定价卡片渲染、支付弹窗、配额显示，约 8 个测试
- [ ] 已有 281 个测试全部通过

## Blocked by

- p1-021: PayJS 支付 + 配额系统（需要支付 API 和配额数据）
