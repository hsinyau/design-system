# @hsinyau/design-system

直角、等宽、1px 描边的 CSS 设计系统。语义 token、两套主题、一组框架无关的组件类；
构建在 Tailwind v4 之上，但组件样式全是原生 CSS，不依赖任何运行时或框架。

## 安装

```bash
pnpm add @hsinyau/design-system
```

字体（Geist + JetBrains Mono，latin / latin-ext 子集）随包分发，不需要另外装字体包。

## 用法一：Tailwind v4 项目（推荐）

入口 CSS 里先引入 Tailwind，再引入本包 —— 顺序不能反，层序 `theme → base → components →
utilities` 由 Tailwind 声明，库的样式必须排在它后面。

```css
@import 'tailwindcss';
@import '@hsinyau/design-system/styles.css'; /* 字体 + token + 基础层 + 组件层 */
```

Vite 侧挂上 Tailwind：

```js
import tailwindcss from '@tailwindcss/vite'

export default { plugins: [tailwindcss()] }
```

tokens.css 里的 `@theme inline` 桥接会让 Tailwind 额外生成 `bg-zz-surface`、
`text-zz-text-muted` 这类工具类；不会再输出 preflight（那由 `@import 'tailwindcss'` 负责）。

按需引入也行：

```css
@import '@hsinyau/design-system/fonts.css';                  /* 可选：不要自带字体就别引 */
@import '@hsinyau/design-system/tokens.css';                 /* token + 两套主题 */
@import '@hsinyau/design-system/base.css';                   /* 元素默认样式 */
@import '@hsinyau/design-system/components/card.css';        /* 单个组件 */
@import '@hsinyau/design-system/theme-transition.css';       /* 可选：主题切换斜切擦除 */
```

## 用法二：不用 Tailwind

包里带了预生成的独立产物，不经过任何构建步骤也能用：

```css
@import '@hsinyau/design-system/standalone.css';
```

或者直接拷文件引用（产物自带字体，`dist/fonts/` 与 CSS 同目录）：

```html
<link rel="stylesheet" href="node_modules/@hsinyau/design-system/dist/design-system.css" />
```

区别只有一个：独立产物不会生成 `bg-zz-surface` 这类 Tailwind 工具类（没有 Tailwind
就没有工具类可言），组件类与 token 完全一致。

## 组件类

| 分组 | 类名 |
| --- | --- |
| 基础 | `.zz-btn`（6 变体 × 8 尺寸）、`.zz-btn-group` |
| 展示 | `.zz-card` `.zz-badge` `.zz-kbd` `.zz-avatar` `.zz-stat` `.zz-callout` `.zz-code` |
| 表单 | `.zz-input` `.zz-textarea` `.zz-select` `.zz-check` `.zz-radio` `.zz-switch` `.zz-field` |
| 数据 | `.zz-table`（`--tight` `--striped` `--bordered`） |
| 导航 | `.zz-navbar` `.zz-sidenav` `.zz-tabs` `.zz-breadcrumb` `.zz-pagination` |
| 浮层 | `.zz-modal` `.zz-tooltip` `.zz-dropdown` |
| 反馈 | `.zz-alert` `.zz-progress` `.zz-spinner` `.zz-toast` `.zz-empty` |
| 长文 | `.zz-prose` |

需要脚本的组件（Tabs、Modal、Dropdown、Toast、主题切换）用原生 `<script>` 驱动，无框架依赖；
类名与 token 明细见仓库里的 `docs/CONVENTIONS.md`。

```html
<!-- 变体类与尺寸类都要给：--default/-outline/…、--xs/--sm/--md/--lg -->
<button class="zz-btn zz-btn--default zz-btn--md">按钮</button>

<article class="zz-card">
  <h3 class="zz-card__title">标题</h3>
  <p>正文……</p>
</article>
```

## 两套主题与局部换主题

```html
<section data-theme="light">…这一段用亮色值渲染…</section>
```

```js
document.documentElement.dataset.theme = 'light' // 或 'dark'
localStorage.setItem('zz-theme', 'light')
```

token 是普通自定义属性，所以任何子树都能局部换主题。

## 三条硬规则

1. 颜色只引用 `var(--zz-*)`，不写死色值，也不用 `--color-zz-*`（那是 Tailwind 工具类专用的 inline token）。
2. 圆角一律 `0`，唯一例外是圆形头像。
3. 层级只用 1px 描边与四档 z-index（100/200/300/400）。

## 许可

本包为 MIT 许可（见 `LICENSE`）。

字体 Geist 与 JetBrains Mono 均为 SIL OFL 1.1，许可证原文随包分发：
`src/styles/fonts/LICENSE-geist.txt`、`src/styles/fonts/LICENSE-jetbrains-mono.txt`。
