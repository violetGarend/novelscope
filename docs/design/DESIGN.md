# Design System — NovelScope

## Product Context
- **What this is:** AI 驱动的中文网文质量评估系统，用数据可视化揭示作品的内在结构
- **Who it's for:** 日更连载网文作者（日均 5000-10000 字），需要快速诊断章节质量
- **Space/industry:** 中文网文写作工具，竞品包括橙瓜、墨者、17K 作家后台
- **Project type:** Web App（单页应用 + 评估报告页）

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian（工业实用风）
- **Decoration level:** Intentional（有意为之）
- **Mood:** 专业、精密、可信。用户应该感觉在使用一个成熟的、经过验证的专业编辑工具——不是冷冰冰的数据仪表盘，也不是花哨的 AI 玩具。
- **核心记忆点:** 数据可视化的力量 — 图表和数据是页面的视觉主角

## Typography
- **Display/Hero:** Instrument Serif（斜体） — 衬线斜体在 SaaS 中罕见，传递"编辑之眼"的专业感和书写温度
- **Body/UI:** Plus Jakarta Sans — 现代几何无衬线，比 Inter 有性格，中文环境下与思源黑体搭配和谐
- **Data/Tables:** Geist Mono（tabular-nums） — 专为数据密集界面设计，数字对齐精确
- **中文回退:** 思源黑体（正文）/ 思源宋体（展示）
- **Loading:** Google Fonts CDN
- **Scale:** 使用 Tailwind 默认字号体系（14px body, 15px/18px/24px/32px/48px 层级）

### Logo Treatment
- "Novel" — Instrument Serif 斜体，正文色
- "Scope" — Geist Mono 正体，主色 #1E40AF
- 中文名"小说望远镜" — 思源宋体，加大字间距，置于英文上方

## Color
- **Approach:** Restraint（克制型）— 蓝是唯一主色，少即是多
- **Primary:** #1E40AF（深蓝） — 信任、专业、冷静。用于 Logo、CTA、关键交互
- **Primary Light:** #3B82F6（亮蓝） — 链接、选中态、次级交互
- **Primary Lighter:** #93C5FD — 边框高亮、focus ring
- **Primary BG:** #EFF6FF — 浅蓝背景、标签底色
- **Background:** #F5F3EF（暖纸色） — 比纯白温暖，减少长时间阅读疲劳
- **Surface:** #FFFFFF — 卡片、模态框
- **Surface Hover:** #F0EDE8
- **Border:** #E5E5E0
- **Border Light:** #EDEBE6
- **Text:** #1A1A1A（主文字）
- **Text Secondary:** #525252（次要文字）
- **Text Muted:** #A3A39E（辅助文字）
- **Semantic:**
  - Success: #059669 / BG: #ECFDF5
  - Warning: #D97706 / BG: #FFFBEB
  - Error: #DC2626 / BG: #FEF2F2
  - Info: #2563EB / BG: #EFF6FF
- **Score Colors:**
  - 高分 7-10: #059669（绿色）
  - 中等 5-6: #D97706（黄色）
  - 低分 0-4: #DC2626（红色）
- **Dark Mode:** 背景 #111318，表面 #1C1F26，hover #282C35，主色提亮为 #3B82F6，降低饱和度 10-20%

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable（舒适）— 网文作者每天看 5000+ 字，界面呼吸感很重要
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Hybrid（混合式） — 应用界面用网格约束，营销页面用编辑式排版
- **Grid:** 12 列（桌面端），单列报告页
- **Max content width:** 1100px
- **Border radius:** sm(4px) md(8px) lg(12px) full(9999px)

## Motion
- **Approach:** Minimal-Functional（极简功能型） — 只做帮助理解的状态转换
- **用途:** 评分数字滚动、进度条推进、图表绘制动画、状态切换
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)

## UI 设计规范（Phase 0 补充）

### 评分可视化
- 数字 + 颜色编码：大号 Geist Mono 数字，颜色随分数段变化
- 绿色 7-10 | 黄色 5-6 | 红色 0-4

### 进度条
- 分步文案式进度条（7 步），每步有明确的中文描述

### 情感设计
- **优势先行**：报告顶部先展示亮点，再展示问题
- **建设性语气**：用"建议"代替"问题"，用"可以更强"代替"偏弱"

### 空状态
- 引导式卡片，带图标和操作指引

### 部分评估失败
- 黄色提示条 + 可用的部分结果

### 错误状态
- 红色卡片 + 图标 + 重试按钮

### 响应式
- Phase 0 仅桌面端（1024px+）

### 无障碍
- 基础 a11y：focus 可见、对比度达标、键盘可达

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-18 | 初始设计系统创建 | 由 /design-consultation 基于产品定位和核心记忆点（数据可视化的力量）创建 |
| 2026-05-18 | 背景色从冷白 #FAFBFC 改为暖纸色 #F5F3EF | 减少长时间阅读疲劳，更舒适 |
| 2026-05-18 | Logo "Novel" 使用 Instrument Serif 料体 | 衬线斜体传递编辑手写感，与 "Scope" 的等宽直立形成对比 |
| 2026-05-18 | 色彩方案选择克制型（单主色） | 蓝是唯一主色，少即是多，避免色彩噪音干扰数据可视化 |
| 2026-05-18 | 字体选择 Instrument Serif + Plus Jakarta Sans + Geist Mono | 三字体各司其职：编辑感 + 可读性 + 数据精确 |
| 2026-05-18 | 数据可视化为页面主角 | 核心记忆点决定，图表和数据是第一视觉元素 |
| 2026-05-18 | 优势先行的情感设计 | 避免 raw scores 伤害用户留存，先展示亮点再提建议 |
| 2026-05-18 | 暖灰体系替代冷灰 | 与暖纸色背景协调，整体更温暖 |
