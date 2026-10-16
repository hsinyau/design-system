# zz design system · 实现约定

所有组件必须遵守以下约定。这是整套系统一致性的来源，不是建议。

## 命名

- 系统名：`zz`。CSS 变量前缀 `--zz-*`，类名前缀 `zz-`。
- 类名扁平、语义化：`.zz-btn`、`.zz-btn--outline`、`.zz-card__media`（BEM 的 `--` 变体 / `__` 元素）。
- 每个组件一组文件：
  - 样式：`packages/design-system/src/styles/components/<name>.css`（随包发布）
  - 组件：`apps/docs/src/components/ui/<Name>.astro`（文档站封装，不进包）
  - 文档页：`apps/docs/src/pages/components/<name>.astro`

## 颜色

- **只用 `var(--zz-*)`**，永远不写死十六进制色值，也不用 `--color-zz-*`（那是 Tailwind 工具类专用的 inline token，不保证作为运行时变量存在）。
- 可用 token：`--zz-bg-deep` `--zz-bg` `--zz-surface` `--zz-surface-2` `--zz-border-subtle` `--zz-border-strong`
  `--zz-text` `--zz-text-secondary` `--zz-text-muted` `--zz-brand` `--zz-brand-soft` `--zz-brand-ink`
  `--zz-danger` `--zz-warning` `--zz-success` `--zz-info` `--zz-accent`
  `--zz-field-bg` `--zz-field-dim/mid/lit/hover/crest` `--zz-elevation` `--zz-elevation-hover`
  `--zz-img-outline` `--zz-scroll-thumb` `--zz-selection`。
- 需要半透明或混合时用 `color-mix(in srgb|oklch, ...)`，不要新增变量。
- 层级暗示：`bg-deep` = 凹槽（代码块/媒体井）→ `bg` = 页面 → `surface` = 面板 → `surface-2` = 交互悬停面。
- 强调色 `brand` 只用于：主按钮填充、焦点环、链接下划线、进度条、当前项标记。

## 形状与层级

- **圆角一律 `0`**，不写 `border-radius`。唯一例外是必须为圆的几何：圆形头像、状态点、单选框、加载圆环、圆点指示器（用 `50%`）。
- 浮起用 `box-shadow: var(--zz-elevation)`，hover 用 `var(--zz-elevation-hover)`；不要自造投影。
- 描边：发丝分隔 `1px solid var(--zz-border-subtle)`；控件描边 `1px solid var(--zz-border-strong)`；
  引用/提示块左线 `2px solid`（brand 或状态色）。
- z-index 只用 `var(--zz-z-nav|dropdown|modal|tooltip)`（100/200/300/400），禁止任意数值。

## 排版

- 默认字体是 **等宽**（`--zz-font-mono`）；只有标题、卡片标题、表头、统计大数字、显式 UI 标签用 `--zz-font-sans`。
  不要引用 Tailwind 生成的 `--font-sans` / `--font-mono`（非 Tailwind 环境里不存在），`check:tokens` 会拦。
- 角色配方：
  - 页面 H1：`1.75rem–2.25rem`，sans，`font-weight 600`，`letter-spacing -0.015em`
  - 区块 H2：`1.5rem` sans 600
  - 卡片标题：`0.875rem` sans 500，`text-wrap: balance` 不需要，直接截断
  - 正文：`0.9375rem`（15px）/ `line-height 1.6`
  - 元信息、日期、计数：`0.75rem` mono `--zz-text-muted`，数字加 `font-variant-numeric: tabular-nums`
  - eyebrow 小标签：`0.625rem–0.6875rem`，`text-transform: uppercase`，`letter-spacing: 0.18em`，`--zz-brand`
- 正文最大宽度 `var(--zz-measure)`（48rem）。

## 间距

- 使用 Tailwind 默认刻度（`--spacing: 0.25rem`）：`0.25/0.5/0.75/1/1.5/2/3/4/6/8` rem。
- 组件内距：卡片 `1rem`，按钮见 button.css，表单控件 `0.625rem 0.75rem`。
- 区块垂直节奏：内页 `2.5rem`（桌面 `3rem`），首页 section `3rem`（桌面 `6rem–7rem`），页脚 `3.5rem`。
- 页面容器：`max-width: 72rem`，横向内距 `1rem`（`sm` 起 `1.5rem`）。

## 交互态（每个可交互元素都要有）

- `:hover` —— 只改背景/描边/文字色，不位移。
- `:focus-visible` —— 全局已给 `outline: 2px solid var(--zz-brand); outline-offset: 2px`，滚动容器内用
  `.zz-scroll-inset` 改内缩；不要用 `outline: none` 抹掉。
- `:active` —— `transform: scale(0.96)`。
- `:disabled` / `[aria-disabled='true']` —— `opacity: .5` + `pointer-events: none`。
- 过渡：`transition-duration: var(--zz-dur)`（150ms）+ `var(--zz-ease)`；只列需要过渡的属性，禁止 `all`。
- 动画一律包在 `@media (prefers-reduced-motion: reduce)` 的降级里。

## Astro 组件

```astro
---
interface Props { class?: string }
const { class: className } = Astro.props
const classes = ['zz-xxx', className].filter(Boolean).join(' ')
---
<div class={classes}><slot /></div>
```

- `class` prop 必须透传（用 `filter(Boolean).join(' ')` 拼接）。
- 组件只输出语义 HTML + 类名，不内联样式（动态值例外）。
- 需要 JS 的（下拉、模态、tabs、主题切换）用**原生 `<script>`**，不用框架；脚本要在 DOM 就绪后执行，
  并保证无 JS 时内容仍可读。

## 文档页

每个组件页通过 `Docs.astro` 布局渲染，结构统一：

1. 标题 + 一句话说明
2. 「用法」示例区（可直接复制的 HTML/类名）
3. 「变体 / 尺寸 / 状态」矩阵
4. 「类名与 token」表
5. 可访问性要点
