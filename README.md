# zz design system

直角、等宽、1px 描边的界面语言。建立在 Tailwind v4 之上的 CSS 变量设计系统，包含 token 层、组件层和一套可浏览的文档站。

灵感来自终端主题网站的设计语言，但 token 命名、组件实现与文档全部是独立实现的。

仓库是一个 pnpm workspace：

| 位置 | 内容 | 发布 |
| --- | --- | --- |
| [`packages/design-system`](packages/design-system) | 设计系统本体：token、基础层、组件样式 | 发布为 `@hsinyau/design-system` |
| [`apps/docs`](apps/docs) | 文档站（Astro，private） | 不发布，部署为静态站 |

## 本地开发

```bash
pnpm install
pnpm dev         # 文档站 http://localhost:4321
pnpm build       # 文档站静态产物在 apps/docs/dist/
pnpm build:lib   # 生成库的独立产物 packages/design-system/dist/
```

## 把系统用在自己的项目里

库只需要一个 `@import`，与框架无关（React / Vue / Svelte / 纯 HTML 都一样）：

```bash
pnpm add @hsinyau/design-system
```

```css
/* Tailwind v4 项目：先 Tailwind，再库 */
@import 'tailwindcss';
@import '@hsinyau/design-system/styles.css';
```

```html
<!-- 不用 Tailwind：用预生成的独立产物（自带字体，无构建步骤） -->
<link rel="stylesheet" href="node_modules/@hsinyau/design-system/dist/design-system.css" />
```

组件是原生 CSS 类（`.zz-btn`、`.zz-card`…），token 是普通自定义属性，运行时不依赖任何东西。
完整说明、按需引入的路径清单与包内导出见 [`packages/design-system/README.md`](packages/design-system/README.md)。

## 目录

```
packages/design-system/
├── src/styles/
│   ├── fonts.css            Geist + JetBrains Mono 可变字体（自托管子集）
│   ├── fonts/*.woff2        字体文件与 OFL 许可证，随包分发
│   ├── tokens.css           语义 token、两套主题、Tailwind 命名空间桥接
│   ├── base.css             元素默认样式与工具类（焦点环、层级、滚动条）
│   ├── theme-transition.css 主题切换的斜切擦除
│   ├── index.css            库入口，按顺序汇总上面这些
│   └── components/*.css     组件层
├── scripts/
│   └── build-standalone.mjs 生成 dist/design-system.css（非 Tailwind 场景用）
└── dist/                    独立产物（构建生成，随包发布）

apps/docs/
├── src/layouts/Docs.astro    文档站布局
├── src/pages/                文档页
├── src/components/ui/*.astro 组件的 Astro 封装（文档站用，不进包）
├── src/lib/routes.ts         文档导航结构
└── src/styles/docs-shell.css 文档站外壳（不参与组件体系）

wrangler.jsonc               Cloudflare 部署配置（assets 指向 apps/docs/dist）
scripts/check-tokens.mjs     一致性检查
scripts/check-classes.mjs    类名交叉审计
docs/CONVENTIONS.md          实现约定（新增组件前必读）
```

## 组件

| 分组 | 组件（`apps/docs/src/components/ui/`） | 类名前缀 |
| --- | --- | --- |
| 基础 | `Button` | `.zz-btn`（6 变体 × 8 尺寸）、`.zz-btn-group` |
| 展示 | `Card` `Badge` `Kbd` `Avatar` `Stat` `Callout` `CodeBlock` | `.zz-card` `.zz-badge` `.zz-kbd` `.zz-avatar` `.zz-stat` `.zz-code` |
| 表单 | `Input` `Textarea` `Select` `Checkbox` `Radio` `Switch` `Field` | `.zz-input` `.zz-textarea` `.zz-select` `.zz-check` `.zz-radio` `.zz-switch` `.zz-field` |
| 数据 | 样式层提供 | `.zz-table`（`--tight` `--striped` `--bordered`） |
| 导航 | `Navbar` `Sidenav` `Tabs` `Breadcrumb` `Pagination` | `.zz-navbar` `.zz-sidenav` `.zz-tabs` `.zz-breadcrumb` `.zz-pagination` |
| 浮层 | `Modal` `Tooltip` `Dropdown` | `.zz-modal` `.zz-tooltip` `.zz-dropdown` |
| 反馈 | `Alert` `Progress` `Spinner` `Toast` `EmptyState` | `.zz-alert` `.zz-progress` `.zz-spinner` `.zz-toast` `.zz-empty` |
| 长文 | 样式层提供 | `.zz-prose`、`.zz-prose__callout` |

Astro 封装只输出类名，不需要 JS 的部分一律零脚本；需要脚本的组件（Tabs、Modal、Dropdown、
Toast、主题切换）都用原生 `<script is:inline>`，无框架依赖。

## 自检

```bash
pnpm check:tokens                 # 无硬编码色值 / 无 inline token 误用 / 无裸 z-index / 无多余圆角
pnpm check:classes                # 没有「用了但没定义」的类名
pnpm build:lib                    # 独立产物能生成
pnpm check                        # astro check + 上面两项
pnpm build                        # 文档站静态构建
```

## 发布库

```bash
pnpm build:lib                                          # 先生成 dist/
npm pack --dry-run --workspace packages/design-system    # 检查包内文件
pnpm --filter @hsinyau/design-system publish            # 需要先 npm login
```

`prepublishOnly` 会自动重新生成 `dist/`；包内只包含 `src/styles`（含字体与许可证）、
`dist/`、`README.md`，文档站不会被发布。

## 部署文档站

`apps/docs` 是纯静态产物（`apps/docs/dist/`），可直接部署到任意静态托管。

用 Cloudflare Workers 静态资源时，**保持工作目录为仓库根即可**（就是现在的配置）：

| 项 | 值 |
| --- | --- |
| 构建命令 | `pnpm install && pnpm build` |
| 部署命令 | `npx wrangler deploy` |
| 静态资源目录 | 根目录 `wrangler.jsonc` 的 `assets.directory` = `./apps/docs/dist` |

根目录这份 `wrangler.jsonc` 是必需的：wrangler 4 在 workspace 根拒绝自动探测应用，
没有显式配置就会报 "application detection logic has been run in the root of a workspace"。
wrangler 的配置按调用目录解析，所以若你把 root directory 改成 `apps/docs`，
就要在那个目录放一份 `wrangler.jsonc` 并把 `directory` 改成 `./dist`。

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
| 字体 | `--zz-font-sans` `--zz-font-mono` | 无衬线（标题）/ 等宽（正文与界面），不依赖 Tailwind 生成 |
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
