# Issue #17: 节奏曲线三线重设计 + 图例交互

## Problem Statement

当前的节奏曲线图表使用单条蓝色折线，数据点按段落类型（动作/对话/描写）着色为红/蓝/绿散点。用户的实际反馈是："我不知道这个折线图是干嘛的，就给我一种有折线图但是不知道他表达的什么意思的感觉"。

三个具体问题：

1. **单线 + 彩色散点的混合可视化让人困惑** — 线的颜色是蓝色，点的颜色却分三种，用户不知道为什么同一条线的不同段落会有不同颜色的点。
2. **看不出每种段落类型的独立走势** — 动作、对话、描写是三种不同的叙事节奏，用户需要分别看到每种类型的张力变化趋势，而不是混在一起。
3. **缺少上下文说明** — 图表没有标题，用户首先要猜测"这个图想告诉我什么"。

## Solution

将单条折线拆分为三条分段折线（动作/对话/描写各一，颜色各自对应），加一条总趋势虚线作为宏观参考。添加图表标题和线段式图例。图例可点击切换对应线条的显示/隐藏。

用户看到图表时：
- 标题"段落张力走势"立即告知图表目的
- 三条彩色线各自代表一种段落类型的张力变化，颜色从线到点保持一致
- 灰色虚线给出整体趋势，三条分段线给出细节
- 点击图例可聚焦单一类型，排除干扰

## User Stories

1. As a 网文作者, I want to see three separate tension lines for action/dialogue/description, so that I can understand how each type of writing contributes to pacing independently.
2. As a 网文作者, I want a dashed trend line showing overall tension across all paragraphs, so that I can quickly grasp the macro pacing arc without being distracted by type switches.
3. As a 网文作者, I want the chart to have a clear title, so that I immediately know what the visualization represents without guessing.
4. As a 网文作者, I want the legend to show line segments instead of colored dots, so that I can intuitively match legend items to the lines on the chart.
5. As a 网文作者, I want to click on a legend item to hide/show the corresponding line, so that I can focus on a specific writing type (e.g., only see action scenes' tension).
6. As a 网文作者, I want hidden lines to also hide their data points from the tooltip, so that the tooltip only shows information relevant to what I'm currently viewing.
7. As a 网文作者, I want the area fill under the chart to reflect all types simultaneously with distinct colors, so that I can see the tension distribution even without reading individual lines.
8. As a 网文作者, I want the trend line to remain visible even when individual type lines are hidden, so that I always have a macro reference regardless of what I toggle.
9. As a 网文作者, I want line segments to break at type transitions (no connecting lines between different types), so that I don't see misleading connections between unrelated paragraphs.
10. As a 网文作者 using the tool on different screen sizes, I want the chart to remain responsive and legible, so that I can use it on both desktop and tablet.

## Implementation Decisions

### 1. 数据结构与分线段逻辑

按段落类型将数据点分组为连续段（segment）。同类型相邻段落归入同一段，类型切换处断开。每个 segment 生成独立的 SVG path。

趋势线通过对每个段落取所有类型张力的中位数计算得到，独立于分线段。

### 2. 图表布局

- 标题"段落张力走势"置于 SVG 顶部居中（text-anchor="middle"），使用设计系统字体
- Y 轴：张力 0-10，刻度线 + 标签
- X 轴：段落号，自适应间隔（≤15 段每段标号，16-30 每 5 段，>30 每 10 段）
- 三条分段折线 + 总趋势虚线（#6B7280，strokeDasharray="6,4"，strokeWidth=1.5）
- 数据点圆半径自适应密度（≤15 点 → r=5，16-25 → r=4，>25 → r=3）
- 三色半透明面积填充（各类型独立渐变叠加，opacity=0.15）

### 3. 图例交互（点击切换显隐）

- 状态：`useState<Set<string>>`，存储当前隐藏的类型
- 默认全部可见
- 点击图例项（线段图标 + 文字）切换对应类型的 hidden 状态
- 隐藏效果：跳过对应 path + circle 渲染，图例项 opacity 降至 0.3
- 总趋势线和面积填充不受影响
- Tooltip 查找最近点时跳过已隐藏类型的数据点
- 图例项包裹在 `<button>` 中以支持键盘无障碍访问（Enter/Space 切换 + aria-pressed）

### 4. 现有行为保持

- SVG viewBox 800×300，响应式缩放
- CSS stroke-dasharray 动画（三线同步 pacing-draw，趋势线 trend-draw）
- 鼠标悬停 tooltip：段落号、类型、张力值
- 空数据优雅降级（"暂无节奏数据"）
- 无外部图表库依赖

### 5. 组件接口不变

```typescript
export interface PacingCurvePoint {
  paragraph: number;
  tension: number;
  type: "action" | "dialogue" | "description";
}

export function PacingCurve({ data }: { data: PacingCurvePoint[] })
//                                       ^^^^ 接口不变
```

外部调用方（ReportCard）不需要任何改动。

### 6. 类型颜色常量

action: #DC2626（红）, dialogue: #3B82F6（蓝）, description: #059669（绿）— 保持不变。趋势线 #6B8288（灰），与现有设计系统一致。

### 7. Deep Module 提取

将分线段构建逻辑和趋势线计算提取为纯函数，使其可在组件外独立测试：

- `buildSegments(data, minP, maxP)` → `TypeSegment[]` — 按类型分组连续点生成 paths
- `computeTrend(data)` → `{ paragraph, tension }[]` — 每段落平均张力
- `findNearestPoint(data, svgX, svgY, minP, maxP, hiddenTypes)` → `PacingCurvePoint | null` — 最近点查找

这些纯函数不依赖 React，可直接在 Vitest 中测试。

## Testing Deisions

### 测试原则

- 测试外部行为（渲染结果、用户交互），不测试内部实现
- 使用 Testing Library 的 render + screen + fireEvent
- Mock `getBoundingClientRect` 以模拟 SVG 容器尺寸

### 适配现有测试（17 个）

- 图例测试：从查找 `rounded-full` 圆点改为查找横线图标
- 数据点测试：circle 总数 = 所有可见类型数据点之和（三线各有独立圆点）
- Tooltip 测试：需要调整 mock 坐标以匹配新的三线布局

### 新增测试（8 个）

1. **三线渲染** — 验证三条不同 stroke 颜色的 path 存在
2. **总趋势线渲染** — 验证虚线 path 存在（strokeDasharray 属性）
3. **线段图例** — 验证图例使用横线（w-5 h-0.5）而非圆点（rounded-full）
4. **标题渲染** — 验证"段落张力走势"文本存在
5. **线断点** — 验证类型切换处连续两段不属于同一 path（两个独立 path element）
6. **图例点击隐藏** — 点击"动作"图例 → 红色 path 消失，图例 opacity 变为 0.3
7. **图例点击恢复** — 再次点击 → 红色 path 恢复，图例 opacity 恢复为 1.0
8. **隐藏后 tooltip 跳过** — 隐藏某类型后 hover 该类型点，tooltip 显示其他类型最近点而非隐藏点

### 预计

总计 25 个测试（17 个现有适配 + 8 个新增），测试运行时间 < 3s。

### Prior Art

- 现有 `PacingCurve.test.tsx`（212 行，17 个测试）— 结构和 mock 策略直接复用
- 现有组件测试的 `mockRect` / `getBoundingClientRect` mock 模式

## Out of Scope

- 后端 pacing 规则引擎修改 — 只改前端渲染，后端数据格式不变
- ReportCard 组件修改 — PacingCurve 接口不变，调用方无需改动
- 暗色模式适配 — 延后到 P2，当前仅支持亮色主题
- 移动端触摸手势 — 延后到 P2
- 导出/打印曲线图 — 不在本期范围
- 数据点的点击事件 — 仅保持 hover tooltip，不添加点击行为

## Further Notes

- 此改动属于 P0 阶段的 UX 修复，解决用户直接反馈的可理解性问题
- 实现优先级：高 — 直接影响用户对核心功能"节奏评分"的理解
- 与 P1 计划无依赖冲突，可独立交付
