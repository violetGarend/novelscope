# Issue p1-011-03: 快速示例文本

## What to build

在左栏输入卡片下方添加快速示例文本区域，降低新用户的使用门槛。

**交互：**
- 输入卡片下方添加一行 `快速试试：` 标签 + 2-3 个示例按钮
- 示例按钮以 `bg-primary-bg text-primary border border-primary-lighter rounded-md px-3 py-1 text-xs hover:bg-primary-lighter/30 transition-colors` 样式渲染
- 点击按钮调用 store 的 `setText` 将对应示例文本填入 textarea
- 示例文本来源于 P0 Golden Sample 测试集中的真实中文网文章节片段，每段约 200-300 字，展示不同的写作风格（动作开场、对话开场、描写开场各一例）

**示例文本内容（内联在代码中）：**
- 示例 A（动作开场）：金庸风格动作描写片段
- 示例 B（对话开场）：现代都市对话片段
- 示例 C（描写开场）：环境氛围描写片段

**约束：**
- 示例文本写在组件文件内的常量数组中，不引入外部文件
- 仅修改 EvaluatePage.tsx，在 idle phase 左栏输入卡片下方插入

## Acceptance criteria

- [x] 输入卡片下方显示 "快速试试：" 标签 + 3 个示例按钮
- [x] 点击示例按钮后 textarea 内容被替换为对应示例文本
- [x] 字数统计随之更新
- [x] 示例按钮样式符合设计系统（`bg-primary-bg` / `text-primary`）
- [x] 所有现有 EvaluatePage 测试通过（20/20）

## Blocked by

p1-011-01（需要在左栏布局基础上添加）
