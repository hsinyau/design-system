# zz design system

直角、等宽、1px 描边的界面语言。建立在 Tailwind v4 之上的 CSS 变量设计系统，包含 token 层、组件层和一套可浏览的文档站。

灵感来自终端主题网站的设计语言，但 token 命名、组件实现与文档全部是独立实现的。

## 快速开始

```bash
pnpm install
pnpm dev        # 文档站 http://localhost:4321
pnpm build      # 静态产物在 dist/
pnpm preview    # 预览构建结果
```

## 把系统用在自己的项目里

样式入口是纯 CSS，不依赖运行时：

```css
@import 'tailwindcss';
@import 'zz-design-system/src/styles/fonts.css';    /* 自托管可变字体 */
@import 'zz-design-system/src/styles/tokens.css';   /* 语义 token + 两套主题 */
@import 'zz-design-system/src/styles/base.css';     /* 元素默认样式 */
@import 'zz-design-system/src/styles/components/button.css'; /* 按需引入组件 */
```

Vite 侧挂上 Tailwind：

```js
import tailwindcss from '@tailwindcss/vite'

export default { plugins: [tailwindcss()] }
```

组件是原生 CSS 类（`.zz-btn`、`.zz-card`…），不经过构建也能用；Astro 组件只是这些类的语法糖。

## 目录

```
src/
├── styles/
│   ├── fonts.css            Geist + JetBrains Mono 可变字体（latin 子集）
│   ├── tokens.css           语义 token、两套主题、Tailwind 命名空间桥接
│   ├── base.css             元素默认样式与工具类（焦点环、层级、滚动条）
│   ├── theme-transition.css 主题切换的斜切擦除
│   ├── docs-shell.css       文档站外壳（不参与组件体系）
│   ├── index.css            样式入口，按顺序汇总上面这些
│   └── components/*.css     组件层
├── components/ui/*.astro    组件的 Astro 封装
├── layouts/Docs.astro       文档站布局
├── pages/                   文档页
└── lib/routes.ts            文档导航结构
docs/CONVENTIONS.md          实现约定（新增组件前必读）
```

## 组件

| 分组 | 组件（`src/components/ui/`） | 类名前缀 |
| --- | --- | --- |
| 基础 | `Button` | `.zz-btn`（6 变体 × 8 尺寸）、`.zz-btn-group` |
| 展示 | `Card` `Badge` `Kbd` `Avatar` `Stat` `Callout` `CodeBlock` | `.zz-card` `.zz-badge` `.zz-kbd` `.zz-avatar` `.zz-stat` `.zz-code` |
| 表单 | `Input` `Textarea` `Select` `Checkbox` `Radio` `Switch` `Field` | `.zz-input` `.zz-textarea` `.zz-select` `.zz-check` `.zz-radio` `.zz-switch` `.zz-field` |
| 数据 | 样式层提供 | `.zz-table`（`--tight` `--striped` `--bordered`） |
| 导航 | `Navbar` `Sidenav` `Tabs` `Breadcrumb` `Pagination` | `.zz-navbar` `.zz-sidenav` `.zz-tabs` `.zz-breadcrumb` `.zz-pagination` |
| 浮层 | `Modal` `Tooltip` `Dropdown` | `.zz-modal` `.zz-tooltip` `.zz-dropdown` |
| 反馈 | `Alert` `Progress` `Spinner` `Toast` `EmptyState` | `.zz-alert` `.zz-progress` `.zz-spinner` `.zz-toast` `.zz-empty` |
| 长文 | 样式层提供 | `.zz-prose`、`.zz-prose__callout` |

需要脚本的组件（Tabs、Modal、Dropdown、Toast、主题切换）都用原生 `<script is:inline>`，无框架依赖。

## 自检

```bash
pnpm check:tokens                 # 无硬编码色值 / 无 inline token 误用 / 无裸 z-index / 无多余圆角
node scripts/check-classes.mjs    # 没有「用了但没定义」的类名
pnpm build                        # 静态构建
```

## token 一览

| 分组 | token | 用途 |
| --- | --- | --- |
| 面 | `--zz-bg-deep` `--zz-bg` `--zz-surface` `--zz-surface-2` | 凹槽 → 页面 → 面板 → 悬停面，四级递进 |
| 线 | `--zz-border-subtle` `--zz-border-strong` | 发丝分隔 / 控件描边，不混用 |
| 文字 | `--zz-text` `--zz-text-secondary` `--zz-text-muted` | 主文本 / 正文 / 元信息 |
| 品牌 | `--zz-brand` `--zz-brand-soft` `--zz-brand-ink` | 强调色、12% 透明版、填充上的文字色 |
| 状态 | `--zz-danger` `--zz-warning` `--zz-success` `--zz-info` `--zz-accent` | 跨主题恒定，语义不漂移 |
| 品牌梯 | `--zz-field-bg/dim/mid/lit/hover/crest` | 明度六阶，用于渐变字标与像素场 |
| 层级 | `--zz-elevation` `--zz-elevation-hover` | 零模糊 1px 外描边（亮色主题叠加真实投影） |
| 覆盖 | `--zz-img-outline` `--zz-scroll-thumb` `--zz-selection` | 图片描边、滚动条、选区 |
| 尺度 | `--zz-measure` `--zz-nav-h` `--zz-z-*` `--zz-dur-*` `--zz-ease` | 正文宽度、顶栏高、层级、动效 |

Tailwind v4 通过 `@theme inline` 把这些桥接成工具类（`bg-zz-surface`、`text-zz-text-muted`…）。

## 两套主题与局部换主题

```css
:root, [data-theme='dark'] { /* 深色，默认 */ }
[data-theme='light']       { /* 亮色 */ }
```

token 是普通自定义属性，所以任何子树都能局部换主题：

```html
<section data-theme="light">…这一段用亮色值渲染…</section>
```

切换与防闪烁：

```js
document.documentElement.dataset.theme = 'light'
localStorage.setItem('zz-theme', 'light')
```

## 三条硬规则

1. **颜色只引用 `var(--zz-*)`**，不写死色值，也不用 `--color-zz-*`（那是 Tailwind 工具类专用的 inline token）。
2. **圆角一律 0**，唯一例外是圆形头像。
3. **层级只用 1px 描边与四档 z-index**（100/200/300/400），不自造投影与任意数值。

新增组件请先读 [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)。
