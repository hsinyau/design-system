# 参考项目设计语言分析（归档）

> 对参考站点 omarchy-site 设计语言的提取，作为本设计系统各项决策的依据。
> 它是外部参考资料，不是本系统的规范：本系统规范见 docs/CONVENTIONS.md，token 值见 src/styles/tokens.css。
> 文中 `--t-*`、`.prose`、`ring-elevation` 等属于参考项目，本系统的对应物是 `--zz-*`、`.zz-prose`、`.zz-elevation`。

---

# Omarchy 站点设计语言提取规范

> 来源：`omarchy-site` 仓库的只读分析。核心文件 `src/styles.css`（2380 行）、`src/theme-transition.css`（137 行）、
> `src/components/**`（React，shadcn/base-ui 风格）、`src/components/ui/**`（11 个桥接组件）、`components.json`、
> `astro.config.mjs`、`src/lib/site-themes.ts`、`src/layouts/Base.astro`。
>
> 本文档只做提取，不复述业务功能、不评价好坏。所有色值/尺寸/时长均取自源码原文，未做近似。
>
> **这套语言最不能丢的四个特征**
>
> 1. **全站直角**：8 个 `--radius-*` token 被显式改写为 `0px`。
> 2. **默认字体是等宽**：`html, body, #app` 用 `--font-mono`，只有标题和显式 `font-sans` 的标签切到 sans。
> 3. **层级用 1px 描边而非投影**：深色主题的"浮起"全由 `0 0 0 1px oklch(1 0 0 / 0.07)` 这类零模糊外描边承担。
> 4. **一套 token、22 个主题**：主题 token 是普通自定义属性，挂在 `[data-theme]` 上，可整棵子树局部覆盖。

---

## 1. 颜色体系

### 1.1 三层命名结构

```
第 1 层  语义主题 token     --t-*        定义在 :root / [data-theme='<id>']，每个主题重写一遍
第 2 层  Tailwind 命名空间   --color-*    在 @theme inline 中把 --t-* 桥接成 Tailwind 颜色名
第 3 层  shadcn 命名桥接     --color-background / --color-primary / …  供 base-ui/shadcn 组件消费
```

- 第 2、3 层都写在 `@theme inline`（[styles.css:82-128](file:///tmp/omarchy-site/src/styles.css#L82-L128)），
  因此工具类编译出的声明**直接引用 `var(--t-*)`**，换主题时不需要重算任何工具类。
- 手写 CSS 一律引用 `--t-*`，不引用 `--color-*`。源码在 `:focus-visible` 处留了原因：
  “Use `--t-brand` directly: `@theme inline` tokens are not runtime custom properties.”
  （[styles.css:947-953](file:///tmp/omarchy-site/src/styles.css#L947-L953)）
  因为 `inline` 的值被内联进工具类，这些 `--color-*` 变量在产物里可能根本没有输出
  （Tailwind v4 默认只生成被用到的变量）；反之 `@theme`（非 inline）里的变量是真实运行时变量。
- 主题 token 是**普通自定义属性**，所以任何子树都能局部改写：

```tsx
// ThemePicker.tsx:422-424 —— 卡片自己就是一个小主题作用域
<span data-theme={SITE_THEMES[index].id} className="block font-sans text-2xl font-semibold tracking-tight">
```

`.dark-scope` 是同一机制的静态版本（见 1.5-F）。
### 1.2 token 语义与层级关系

| token | 语义 | 使用场合 |
| --- | --- | --- |
| `--t-bg-deep` | 最深的"凹槽" | 代码块、图片井 `aspect-video bg-bg-deep`、安装命令条、搜索输入框、Select 触发器、`.prose pre` |
| `--t-bg` | 页面地面 | `body`、`#main`、半透明遮罩底 `bg-bg/60` `bg-bg/85` `bg-bg/95` |
| `--t-surface` | 抬起的面板 | 卡片、`ring-elevation` 容器、弹层、表头 |
| `--t-surface-2` | 再抬一级 = **交互悬停面** | `hover:bg-surface-2`、导航当前项、行内 code 底 |
| `--t-border-subtle` | 发丝线 | section 分隔、表格单元格、卡片内分隔、页脚顶线。22 个主题里**全部与 `surface-2` 同值** |
| `--t-border-strong` | 控件描边 | 输入框、outline 按钮、Select、`--color-input` |
| `--t-text` | 主文本 | 标题、当前项文字 |
| `--t-text-secondary` | 次级文本 | `.prose` 正文默认色、导航标签、描述段落 |
| `--t-text-muted` | 弱文本 | 元信息（日期/作者/数量）、`::marker`、图注、placeholder |
| `--t-brand` | 强调色 | 链接下划线 hover、焦点环、进度线、滚动条滑块、`--color-primary` |
| `--t-brand-soft` | brand 的 12% 透明版（`…1f` = alpha 31/255 ≈ 12.2%） | 仅 `parked/plugins` 路由用（`bg-brand-soft`） |
| `--t-brand-ink` | **brand 填充上的文字色** | 主按钮文字（`--color-primary-foreground`）、选中 chip 文字 |
| `--t-field-bg` | 像素场地面 | 页脚/404/首页 hero 的 `style={{ background: 'var(--t-field-bg)' }}` |
| `--t-field-dim` → `mid` → `lit` → `hover` → `crest` | 品牌 6 阶明度梯（dim 最暗，crest 最亮） | 字标 5 段渐变、hero 像素场、滚动条滑块 hover/active |
| `--t-elevation` / `--t-elevation-hover` | 层级描边（见第 5 节） | `.ring-elevation` / `.ring-elevation-hover` |
| `--t-img-outline` | 图片 1px 描边 | `.img-outlined` |
| `--t-scroll-thumb` | 代码块横向滚动条滑块 | `.prose pre::-webkit-scrollbar-thumb` |
| `--t-selection` | 文本选区底色 | `::selection` |
| `--t-hdr-text` `-text-2` `-brand` `-ink` `-surface` `-surface-2` | 导航混合层（`mix-blend-difference` 幽灵层）配色 | 实际只消费 `--t-hdr-text-2`（[SiteHeader.tsx:735/745/776](file:///tmp/omarchy-site/src/components/SiteHeader.tsx#L735)）；其余 5 个定义了但当前无引用 |
| `--t-partner-*`（4 个） | 赞助商品牌色 | 只在 catppuccin-latte / flexoki-light / lupine 定义 |

**层级关系（深色主题示例，tokyo-night）**

```
#13141c  bg-deep       最深，凹槽
#1a1b26  bg            页面地面
#1f2230  surface       卡片抬起
#24283b  surface-2 == border-subtle     交互面 / 发丝线（同一个值）
#414868  border-strong                  控件描边（明显更亮）
#c0caf5  text → #a9b1d6 text-secondary → #8b93b8 text-muted     三级文字
#9ece6a  brand → #9ece6a1f brand-soft → #0c0e10 brand-ink
```

**主题清单**：CSS 里 22 个主题块，与 `src/lib/site-themes.ts` 的 `SITE_THEMES` 22 项一一对应。
默认 `tokyo-night`；浅色主题 5 个：`catppuccin-latte`、`flexoki-light`、`lupine`、`rose-pine`、`white`（均带 `light: true`）。
首次访问按系统 `prefers-color-scheme` 在对应明暗分组里**随机**挑一个
（[theme.ts:22-28](file:///tmp/omarchy-site/src/lib/theme.ts#L22-L28)），键名 `localStorage['omarchy-site-theme']`。

### 1.3 固定色（不随主题变化）

定义在 `@theme inline`（[styles.css:101-127](file:///tmp/omarchy-site/src/styles.css#L101-L127)）：

| Tailwind 名 | 值 | 用途 |
| --- | --- | --- |
| `--color-tn-blue` | `oklch(0.719 0.132 264.2)` | 插件强调色 |
| `--color-tn-purple` | `oklch(0.751 0.134 299.5)` | 插件强调色 |
| `--color-tn-cyan` | `oklch(0.82 0.105 235.7)` | `.docs .syntax-key` |
| `--color-tn-orange` | `oklch(0.787 0.137 50.6)` | `.docs .syntax-number`、`.prominent-callout` 左边线 |
| `--color-tn-red` | `oklch(0.723 0.159 10.3)` | 插件强调色 |
| `--color-tn-yellow` | `oklch(0.784 0.106 75.4)` | 插件强调色 |
| `--color-destructive` | `oklch(0.723 0.159 10.3)` | **不随主题**，等于 tokyo-night 的红 |
| `--color-brand-fill` / `--color-brand-ink` | `var(--t-brand)` / `var(--t-brand-ink)` | 别名 |

### 1.4 shadcn 桥接映射（原文）

```css
/* shadcn token bridge */
--color-background: var(--t-bg);
--color-foreground: var(--t-text);
--color-card: var(--t-surface);
--color-card-foreground: var(--t-text);
--color-popover: var(--t-surface);
--color-popover-foreground: var(--t-text);
--color-primary: var(--t-brand);
--color-primary-foreground: var(--t-brand-ink);
--color-accent: var(--t-surface-2);
--color-accent-foreground: var(--t-text);
--color-secondary: var(--t-surface-2);
--color-secondary-foreground: var(--t-text);
--color-muted: var(--t-surface-2);
--color-muted-foreground: var(--t-text-secondary);
--color-destructive: oklch(0.723 0.159 10.3);
--color-border: var(--t-border-subtle);
--color-input: var(--t-border-strong);
/* Use the accent to meet the 3:1 focus-indicator contrast requirement. */
--color-ring: var(--t-brand);
```

注意 `card` / `popover` / `accent` / `secondary` / `muted` 全部塌缩到 `surface` 或 `surface-2`——shadcn 的 4 个
层级在这套语言里只有 2 级，所以"选中态"不能只靠 `bg-surface-2`（多个主题里它与 `surface` 同值）：

```tsx
// SearchPalette.tsx:388-392
// surface-2 collapses onto surface in several themes, which leaves the cursor invisible.
'bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] text-brand'
```
### 1.5 全量 token 值（22 主题）

#### A. 基础面与文本

| 主题 | bg-deep | bg | surface | surface-2 | border-subtle | border-strong | text | text-secondary | text-muted | brand | brand-soft | brand-ink |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tokyo-night (`:root` 默认) | `#13141c` | `#1a1b26` | `#1f2230` | `#24283b` | `#24283b` | `#414868` | `#c0caf5` | `#a9b1d6` | `#8b93b8` | `#9ece6a` | `#9ece6a1f` | `#0c0e10` |
| white | `#f5f5f5` | `#ffffff` | `#ffffff` | `#f5f5f5` | `#e8e8e8` | `#c0c0c0` | `#000000` | `#383838` | `#4a4a4a` | `#6e6e6e` | `#6e6e6e1f` | `#ffffff` |
| catppuccin | `#161622` | `#1e1e2e` | `#282839` | `#313244` | `#313244` | `#585b70` | `#cdd6f4` | `#cdd6f4` | `#9399b2` | `#89b4fa` | `#89b4fa1f` | `#0c0e10` |
| gruvbox | `#1e1e1e` | `#282828` | `#32302f` | `#3c3836` | `#3c3836` | `#665c54` | `#d4be98` | `#d4be98` | `#a89984` | `#7daea3` | `#7daea31f` | `#0c0e10` |
| matte-black | `#0d0d0d` | `#121212` | `#181818` | `#1e1e1e` | `#1e1e1e` | `#333333` | `#eaeaea` | `#bebebe` | `#8a8a8a` | `#e68e0d` | `#e68e0d1f` | `#0c0e10` |
| rose-pine | `#ede7e1` | `#faf4ed` | `#fffaf3` | `#ede7e1` | `#e1dbd5` | `#cecacd` | `#575279` | `#5e587d` | `#676284` | `#56949f` | `#56949f1f` | `#ffffff` |
| catppuccin-latte | `#e3e4e8` | `#eff1f5` | `#f8f9fb` | `#e3e4e8` | `#d7d8dc` | `#acb0be` | `#4c4f69` | `#53556f` | `#5c5f77` | `#1e66f5` | `#1e66f51f` | `#ffffff` |
| ethereal | `#040816` | `#060b1e` | `#0c122c` | `#131a3a` | `#131a3a` | `#6d7db6` | `#ffcead` | `#ffcead` | `#b6a6b2` | `#7d82d9` | `#7d82d91f` | `#0c0e10` |
| everforest | `#21272c` | `#2d353b` | `#303a40` | `#343f44` | `#343f44` | `#475258` | `#d3c6aa` | `#d3c6aa` | `#918f84` | `#7fbbb3` | `#7fbbb31f` | `#0c0e10` |
| flexoki-light | `#f2efe4` | `#fffcf0` | `#f9f6ea` | `#f2efe4` | `#e5e2d8` | `#b7b5ac` | `#100f0f` | `#454340` | `#555450` | `#205ea6` | `#205ea61f` | `#ffffff` |
| hackerman | `#080910` | `#0b0c16` | `#10121f` | `#151828` | `#151828` | `#2d3450` | `#ddf7ff` | `#ddf7ff` | `#a4b2ca` | `#82fb9c` | `#82fb9c1f` | `#0c0e10` |
| kanagawa | `#17171e` | `#1f1f28` | `#202838` | `#223249` | `#223249` | `#54546d` | `#dcd7ba` | `#dcd7ba` | `#a7a492` | `#dcd7ba` | `#dcd7ba1f` | `#0c0e10` |
| last-horizon | `#090809` | `#0c0b0c` | `#0c0b0c` | `#0c0b0c` | `#0c0b0c` | `#584e51` | `#fafcfb` | `#e2dddc` | `#a9a5a6` | `#b59790` | `#b597901f` | `#0c0e10` |
| lumon | `#101b21` | `#16242d` | `#182836` | `#1b2d40` | `#1b2d40` | `#304860` | `#f2fcff` | `#d6e2ee` | `#a0c1d8` | `#8bc9eb` | `#8bc9eb1f` | `#0c0e10` |
| lupine | `#ececec` | `#fafafa` | `#ffffff` | `#ececec` | `#dedede` | `#9e9e9e` | `#000000` | `#212121` | `#484848` | `#3264eb` | `#3264eb1f` | `#ffffff` |
| miasma | `#191919` | `#222222` | `#272727` | `#2c2c2c` | `#2c2c2c` | `#666666` | `#c2c2b0` | `#c2c2b0` | `#8c8c82` | `#78824b` | `#78824b1f` | `#0c0e10` |
| nord | `#222730` | `#2e3440` | `#343b49` | `#3b4252` | `#3b4252` | `#4c566a` | `#d8dee9` | `#d8dee9` | `#9fa7b4` | `#81a1c1` | `#81a1c11f` | `#0c0e10` |
| osaka-jade | `#0c1512` | `#111c18` | `#1a2a22` | `#23372b` | `#23372b` | `#53685b` | `#f7e8b2` | `#c1c497` | `#969978` | `#509475` | `#5094751f` | `#0c0e10` |
| retro-82 | `#031222` | `#05182e` | `#081e37` | `#0a2540` | `#0a2540` | `#2a6b78` | `#f6dcac` | `#f6dcac` | `#9ab69b` | `#faa968` | `#faa9681f` | `#0c0e10` |
| ristretto | `#211b1b` | `#2c2525` | `#342a28` | `#3d2f2a` | `#3d2f2a` | `#72696a` | `#e6d9db` | `#e6d9db` | `#aca1a2` | `#f38d70` | `#f38d701f` | `#0c0e10` |
| solitude | `#0c0e10` | `#101315` | `#101315` | `#101315` | `#101315` | `#4b4e55` | `#cacccc` | `#a5aeb4` | `#8a8d90` | `#798186` | `#7981861f` | `#0c0e10` |
| vantablack | `#090909` | `#000000` | `#0d0d0d` | `#1a1a1a` | `#1a1a1a` | `#7a7a7a` | `#ffffff` | `#ffffff` | `#a8a8a8` | `#8d8d8d` | `#8d8d8d1f` | `#0c0e10` |

> - `brand-soft` 一律等于 `brand` 的十六进制值 + `1f` 后缀（≈12% alpha）。
> - 深色主题 `brand-ink` 恒为 `#0c0e10`；浅色主题为 `#ffffff`。
> - `border-subtle` 与 `surface-2` 在 22 个主题里**全部同值**；`solitude`、`last-horizon` 连
>   `bg`/`surface`/`surface-2`/`border-subtle` 都是同一色（这类主题只剩描边区分层级）。
> - `catppuccin`、`gruvbox`、`ethereal`、`everforest`、`hackerman`、`kanagawa`、`miasma`、`nord`、`retro-82`、
>   `ristretto`、`vantablack` 的 `text-secondary` 与 `text` 同值——即"次级文字"在这些主题里只靠 `text-muted` 表达。

#### B. 阴影 / 覆盖 / 明暗

`--t-elevation` 只有 **2 组取值**（[styles.css:166-167](file:///tmp/omarchy-site/src/styles.css#L166-L167)、
[styles.css:199-204](file:///tmp/omarchy-site/src/styles.css#L199-L204)）：

```css
/* 深色组（17 个主题）：tokyo-night, catppuccin, gruvbox, matte-black, ethereal, everforest,
   hackerman, kanagawa, last-horizon, lumon, miasma, nord, osaka-jade, retro-82,
   ristretto, solitude, vantablack */
--t-elevation: 0 0 0 1px oklch(1 0 0 / 0.07);
--t-elevation-hover: 0 0 0 1px oklch(1 0 0 / 0.13);

/* 浅色组（5 个主题）：white, rose-pine, catppuccin-latte, flexoki-light, lupine */
--t-elevation:
  0 0 0 1px oklch(0 0 0 / 0.06), 0 1px 3px oklch(0 0 0 / 0.05),
  0 4px 10px -4px oklch(0 0 0 / 0.05);
--t-elevation-hover:
  0 0 0 1px oklch(0 0 0 / 0.09), 0 1px 3px oklch(0 0 0 / 0.07),
  0 4px 10px -4px oklch(0 0 0 / 0.08);
```

其余三个覆盖类 token 与 `color-scheme` 亦只有两组取值（深色组：`img-outline: rgb(255 255 255 / 0.1)`、
`scroll-thumb: rgb(255 255 255 / 0.14)`、`color-scheme: dark`；浅色组：`rgb(0 0 0 / 0.1)`、
`rgb(0 0 0 / 0.18)`、`color-scheme: light`）。`--t-selection` 每主题各不相同：

| 主题 | selection |
| --- | --- |
| tokyo-night | `#292e42` |
| white | `#c0c0c0` |
| catppuccin | `#45475a` |
| gruvbox | `#504945` |
| matte-black | `#2a2a2a` |
| rose-pine | `#dfdad9` |
| catppuccin-latte | `#ccd0da` |
| ethereal | `#252e56` |
| everforest | `#3d484d` |
| flexoki-light | `#cecdc3` |
| hackerman | `#1f253a` |
| kanagawa | `#363646` |
| last-horizon | `#584e51` |
| lumon | `#243d56` |
| lupine | `#d0d0d0` |
| miasma | `#383838` |
| nord | `#434c5e` |
| osaka-jade | `#32473b` |
| retro-82 | `#134e5a` |
| ristretto | `#403e41` |
| solitude | `#343d41` |
| vantablack | `#1a1a1a` |
#### C. field 阶梯（品牌渐变 + 像素场）

| 主题 | field-bg | field-dim | field-mid | field-lit | field-hover | field-crest |
| --- | --- | --- | --- | --- | --- | --- |
| tokyo-night | `#0e0e14` | `#39482e` | `#678549` | `#9ece6a` | `#bbdd97` | `#daecc6` |
| white | `#e8e8e8` | `#c3c3c3` | `#9c9c9c` | `#6e6e6e` | `#565656` | `#3c3c3c` |
| catppuccin | `#101019` | `#34415c` | `#5b76a4` | `#89b4fa` | `#accafc` | `#d2e2fd` |
| gruvbox | `#161616` | `#354440` | `#56746d` | `#7daea3` | `#a4c6bf` | `#cee0dc` |
| matte-black | `#090909` | `#4b310a` | `#925b0b` | `#e68e0d` | `#eeb056` | `#f6d4a3` |
| rose-pine | `#e1dbd5` | `#b7c6c5` | `#8bafb4` | `#56949f` | `#43737c` | `#2f5157` |
| catppuccin-latte | `#d7d8dc` | `#a0b6e4` | `#6491ec` | `#1e66f5` | `#1750bf` | `#103887` |
| ethereal | `#030610` | `#282b4c` | `#4f538d` | `#7d82d9` | `#a4a8e4` | `#ced0f1` |
| everforest | `#181d20` | `#374c4c` | `#587f7b` | `#7fbbb3` | `#a5cfca` | `#cee5e2` |
| flexoki-light | `#e5e2d8` | `#aabac9` | `#6b90b9` | `#205ea6` | `#194981` | `#12345b` |
| hackerman | `#06060c` | `#2b5037` | `#539e65` | `#82fb9c` | `#a8fcba` | `#d0fdd9` |
| kanagawa | `#111116` | `#4e4c47` | `#8f8c7c` | `#dcd7ba` | `#e6e3cf` | `#f2f0e5` |
| last-horizon | `#060606` | `#3a322f` | `#72605c` | `#b59790` | `#cbb6b1` | `#e3d7d5` |
| lumon | `#0b1216` | `#314956` | `#5a839a` | `#8bc9eb` | `#aed9f1` | `#d3eaf7` |
| lupine | `#dedede` | `#aab9e2` | `#7392e6` | `#3264eb` | `#274eb7` | `#1c3781` |
| miasma | `#121212` | `#313423` | `#515735` | `#78824b` | `#a0a881` | `#ccd0bb` |
| nord | `#191c23` | `#384452` | `#596e85` | `#81a1c1` | `#a7bdd4` | `#cfdbe7` |
| osaka-jade | `#090f0d` | `#1e372c` | `#35614d` | `#509475` | `#84b49e` | `#bcd6cb` |
| retro-82 | `#020c17` | `#4c3b2f` | `#9c6d49` | `#faa968` | `#fcc395` | `#fddec6` |
| ristretto | `#181414` | `#5a3830` | `#a05f4d` | `#f38d70` | `#f7af9b` | `#fad4c9` |
| solitude | `#080a0b` | `#2a2e30` | `#4e5457` | `#798186` | `#a1a7aa` | `#cccfd1` |
| vantablack | `#070707` | `#2f2f2f` | `#5a5a5a` | `#8d8d8d` | `#afafaf` | `#d4d4d4` |

规律：任何主题里 `field-lit` = `brand`；深色主题的 `hover`/`crest` 向白推，浅色主题向黑推——所以字标渐变
在任何主题上都是"从地面亮起"的同一方向。

**品牌字标 = 5 段渐变 + SVG mask**（[styles.css:2342-2361](file:///tmp/omarchy-site/src/styles.css#L2342-L2361)、
[Brand.tsx:27-33](file:///tmp/omarchy-site/src/components/Brand.tsx#L27-L33)），分段比例来自 19 行像素带（5/2/4/3/5）：

```css
.brand__preview {
  background: linear-gradient(
    to bottom,
    var(--t-field-crest) 0 26.316%,
    var(--t-field-hover) 26.316% 36.842%,
    var(--t-field-lit) 36.842% 57.895%,
    var(--t-field-mid) 57.895% 73.684%,
    var(--t-field-dim) 73.684% 100%
  );
  mask: var(--brand-mask) no-repeat center / 100% 100%;
}
/* 三个字标各带自己的 mask 与宽高比 */
.brand__preview--wordmark { aspect-ratio: 4131 / 950;  --brand-mask: url('/brand/omarchy-wordmark.svg'); }
.brand__preview--logo     { aspect-ratio: 1;          --brand-mask: url('/brand/omarchy-logo.svg'); max-width: 20rem; }
.brand__preview--oma      { aspect-ratio: 722 / 300;  --brand-mask: url('/brand/oma-logo-mask.svg'); max-width: 30rem; }
```

#### D. hdr 组（导航混合层）

| 主题 | hdr-text | hdr-text-2 | hdr-brand | hdr-ink | hdr-surface-2 | hdr-surface |
| --- | --- | --- | --- | --- | --- | --- |
| tokyo-night | `#ced8ff` | `#b7bfea` | `#acdc7e` | `#1a1c24` | `#32364f` | `#2d3044` |
| white | `#e8e8e8` | `#b0b0b0` | `#7a7a7a` | `#000000` | `#000000` | `#000000` |
| catppuccin | `#dde6ff` | `#dde6ff` | `#99c4ff` | `#1c1e29` | `#41425d` | `#383852` |
| gruvbox | `#ead4ae` | `#ead4ae` | `#93c4b9` | `#222426` | `#524e4c` | `#484645` |
| matte-black | `#f3f3f3` | `#c7c7c7` | `#ef9716` | `#151719` | `#272727` | `#212121` |
| rose-pine | `#8a895c` | `#838358` | `#8b4736` | `#000000` | `#000000` | `#000000` |
| catppuccin-latte | `#8b8973` | `#84836d` | `#b97200` | `#000000` | `#000000` | `#000000` |
| ethereal | `#ffd4bd` | `#ffd4bd` | `#8088e9` | `#0f1420` | `#16204a` | `#10183c` |
| everforest | `#ebe3ca` | `#ebe3ca` | `#97d8d3` | `#242b30` | `#4c5c64` | `#485760` |
| flexoki-light | `#d5d3c9` | `#a09f98` | `#c58432` | `#000000` | `#000000` | `#000000` |
| hackerman | `#e3fdff` | `#e3fdff` | `#88ffa8` | `#12141c` | `#1b1e34` | `#16182b` |
| kanagawa | `#ede8d0` | `#ede8d0` | `#ede8d0` | `#1d1f26` | `#33435f` | `#323a4e` |
| last-horizon | `#ffffff` | `#e8e3e2` | `#bb9d96` | `#121416` | `#121112` | `#121112` |
| lumon | `#fdffff` | `#e1f4ff` | `#96dbff` | `#172026` | `#263f56` | `#243a4c` |
| lupine | `#dedede` | `#bdbdbd` | `#ac7a00` | `#000000` | `#000000` | `#000000` |
| miasma | `#d4d4c2` | `#d4d4c2` | `#8a945d` | `#1e2022` | `#3e3e3e` | `#393939` |
| nord | `#f1faff` | `#f1faff` | `#9abde4` | `#252a33` | `#545e75` | `#4e576c` |
| osaka-jade | `#fff7bf` | `#cad3a4` | `#59a382` | `#151d1d` | `#2c4638` | `#23382e` |
| retro-82 | `#f8e8c3` | `#f8e8c3` | `#fcb57f` | `#0e1a27` | `#0c3157` | `#0a2a4e` |
| ristretto | `#feedef` | `#feedef` | `#ffa184` | `#242224` | `#55433e` | `#4c3e3c` |
| solitude | `#d2d6d7` | `#adb8bf` | `#818b91` | `#14181b` | `#181d20` | `#181d20` |
| vantablack | `#ffffff` | `#ffffff` | `#949494` | `#131517` | `#212121` | `#141414` |

#### E. partner 色（只在 3 个浅色主题里定义）

| 属性 | 值 |
| --- | --- |
| `--t-partner-37signals` | `#c53030` |
| `--t-partner-basecamp` | `#b45309` |
| `--t-partner-hey` | `#5522fa` |
| `--t-partner-cloudflare` | `#c2410c` |

出现于 `catppuccin-latte`、`flexoki-light`、`lupine`（[styles.css:394-397](file:///tmp/omarchy-site/src/styles.css#L394-L397)）。

#### F. `.dark-scope`（局部固定深色）

用于"无论当前主题都画深色"的区域（[styles.css:911-930](file:///tmp/omarchy-site/src/styles.css#L911-L930)）。
它**不**重复 `--t-brand-ink`（保留继承值），其余与 tokyo-night 完全一致：

```css
.dark-scope {
  --t-bg-deep: #13141c;
  --t-bg: #1a1b26;
  --t-surface: #1f2230;
  --t-surface-2: #24283b;
  --t-border-subtle: #24283b;
  --t-border-strong: #414868;
  --t-text: #c0caf5;
  --t-text-secondary: #a9b1d6;
  --t-text-muted: #8b93b8;
  --t-brand: #9ece6a;
  --t-brand-soft: #9ece6a1f;
  --t-elevation: 0 0 0 1px oklch(1 0 0 / 0.07);
  --t-elevation-hover: 0 0 0 1px oklch(1 0 0 / 0.13);
  --t-img-outline: rgb(255 255 255 / 0.1);
  --t-scroll-thumb: rgb(255 255 255 / 0.14);
  color-scheme: dark;
}
```
---

## 2. 圆角策略

**结论：只有 3 处非零圆角，且都不是设计圆角，而是图形/几何需求。**

```css
/* styles.css:130-146 */
@theme {
  --measure: 48rem;
  --radius-xs: 0px;
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;
  --radius-2xl: 0px;
  --radius-3xl: 0px;
  --radius-4xl: 0px;

  /* z-index scale: no arbitrary values anywhere else */
  --z-nav: 100;
  --z-dropdown: 200;
  --z-modal: 300;
  --z-tooltip: 400;
}
```

Tailwind v4 的圆角工具类全部读 `--radius-*`，把 8 个 token 归零就等于**全站 `rounded-*` 全部 = 0**。
这解释了代码里为什么还能看到 `rounded-lg` / `rounded-xl` / `rounded-md` / `rounded-4xl`：它们是语义占位，
实际渲染 0 圆角（按钮 `rounded-lg`、卡片 `rounded-xl`、徽章 `rounded-4xl`）。

| 写法 | 实际值 | 出现位置 |
| --- | --- | --- |
| `rounded-xs` … `rounded-4xl` | `0` | 全站：button 9 处、卡片 8 处、input/select/tabs/scroll-area 等 |
| `rounded-none` | `0` | 2 处（toggle-group 无间距拼接态） |
| `rounded-[min(var(--radius-md),12px)]` / `[min(var(--radius-md),10px)]` | `0` | toggle / toggle-group 的 `size="sm"` |
| `rounded-[inherit]` | 继承父级 = `0` | `ScrollArea` viewport |
| 裸 `rounded` | `var(--radius-sm)` = `0` | 2 处：tooltip 里的 `<kbd>`、行内 `<code>`（v4 保留的兼容写法，等价 `rounded-sm`） |
| `rounded-full` | `calc(infinity * 1px)` | **例外 1：纯圆形**。头像（36px / 44px 圆）、播放按钮圆底、圆形图标底 |
| `rounded-[2px]` | `2px` | **例外 2：tooltip 箭头**（`size-2.5 rotate-45`，[tooltip.tsx:57](file:///tmp/omarchy-site/src/components/ui/tooltip.tsx#L57)） |
| `<input>` | 无声明 | `SearchField` 的 input 不写 radius，浏览器默认 0 |

另外两处显式 `border-radius: 0` 是重申而非新增：
`.ported :has(#founding-patrons) .member__avatar { border-radius: 0 }`（[:1495](file:///tmp/omarchy-site/src/styles.css#L1495)）、
`.music-seek::-moz-range-thumb { border-radius: 0 }`（[:2085](file:///tmp/omarchy-site/src/styles.css#L2085)）。

**要照抄的最小实现**：8 个 `--radius-*` token 全设 `0px`，只给圆形元素 `rounded-full`。

---

## 3. 排版

### 3.1 字体族

```css
@theme inline {
  --font-sans: 'Geist Variable', sans-serif;
  --font-mono: 'JetBrains Mono Variable', monospace;
}

html, body, #app { min-height: 100%; font-family: var(--font-mono); } /* ← 全站默认等宽 */

h1, h2, h3, h4, h5, h6 { font-family: var(--font-sans); text-wrap: balance; }

body {
  font-family: var(--font-mono);
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

字体自托管，共 6 个可变字体（[styles.css:9-80](file:///tmp/omarchy-site/src/styles.css#L9-L80)），
只含 `latin` + `latin-ext` 两个 subset，用 `unicode-range` 切分，`font-display: swap`，在 `Base.astro` 里 `preload`：

| 家族 | 字重范围 | 样式 | 文件 |
| --- | --- | --- | --- |
| `'Geist Variable'` | `100 900` | normal | `geist-latin-ext-wght-normal.woff2`、`geist-latin-wght-normal.woff2` |
| `'JetBrains Mono Variable'` | `100 800` | normal | `jetbrains-mono-latin{,-ext}-wght-normal.woff2` |
| `'JetBrains Mono Variable'` | `100 800` | italic | `jetbrains-mono-latin{,-ext}-wght-italic.woff2` |

**等宽（mono）用在哪些地方**

| 场景 | 证据 |
| --- | --- |
| **全站默认正文字体** | `html, body, #app { font-family: var(--font-mono) }`（[:960-965](file:///tmp/omarchy-site/src/styles.css#L960-L965)） |
| `.prose` 正文、`.page-subtitle` | `.page-subtitle { font-family: var(--font-mono) }`（[:2338-2340](file:///tmp/omarchy-site/src/styles.css#L2338-L2340)） |
| `code` / `pre` / `kbd` | `.prose code, .prose kbd { font-family: var(--font-mono); font-size: 0.86em }` |
| 元信息：日期、作者、数量、handle、条目作者 | `font-mono text-xs text-text-muted`（全仓 47 处 `font-mono`） |
| 控件：搜索框、Select 触发/选项、安装命令条、复制按钮、手册 TOC 章节 | `font-mono text-[13px]`、`font-mono text-[11px]` |
| 数字（统计值） | 另加 `tabular-nums`（PluginCard 的 hearts/stars） |
| eyebrow 小标签 | `font-mono text-[10px] tracking-wide uppercase` |

**sans 用在哪些地方**

| 场景 | 证据 |
| --- | --- |
| 全部标题 `h1`–`h6` | 全局规则 |
| 卡片标题（`h3`）、section 标题、`.team__name`、`.badge__name`、`.member__name`、`.rule__name`、`.troubleshooting-list dt` | 各处 `font-family: var(--font-sans)` |
| 表格表头 `.prose th` | `font-family: var(--font-sans); font-weight: 600` |
| 显式写的 UI 标签 | 主题提示卡标题、音乐卡曲名、页脚分栏标题（`font-sans text-xs tracking-widest uppercase`）、Voices 正文（`font-sans text-[15px] leading-snug`）、统计大数字（`font-sans text-6xl font-bold`） |
| 主题选择器里的主题名 | `font-sans text-2xl font-semibold tracking-tight` |

> 反直觉但重要：**按钮、导航链接、表单控件默认是 mono**（它们不声明 `font-family`，继承 `body`），
> 只有显式写 `font-sans` 的才走 sans。复刻时若从 sans 基线出发，观感会完全不同。

### 3.2 字号 / 行高 / 字重

Tailwind v4 默认刻度，本仓库**未定义任何 `--text-*`**，即下表全部是框架默认值；`text-[Npx]` 为任意值：

| 类 | font-size | line-height |
| --- | --- | --- |
| `text-[10px]` | 10px | 继承 |
| `text-[11px]` | 11px | 继承 |
| `text-[12px]` | 12px | 继承 |
| `text-xs` | 0.75rem (12px) | 1rem (16px) |
| `text-[13px]` | 13px | 继承 |
| `text-sm` | 0.875rem (14px) | 1.25rem (20px) |
| `text-[15px]` | 15px | 继承（配 `leading-relaxed`） |
| `text-base` | 1rem (16px) | 1.5rem (24px) |
| `text-[0.8rem]` | 0.8rem (12.8px) | 继承 |
| `text-lg` | 1.125rem (18px) | 1.75rem (28px) |
| `text-xl` | 1.25rem (20px) | 1.75rem (28px) |
| `text-2xl` | 1.5rem (24px) | 2rem (32px) |
| `text-[1.75rem]` | 1.75rem (28px) | 继承 |
| `text-3xl` | 1.875rem (30px) | 2.25rem (36px) |
| `text-6xl` | 3.75rem (60px) | 1 |

使用频次（`src/components` + `src/astro` + `src/pages` 计数）：`text-sm` 49、`text-xs` 32、`text-[15px]` 30、
`text-[13px]` 21、`text-lg` 17、`text-3xl` 6、`text-2xl` 5、`text-base` 5、`text-[12px]` 5、`text-[11px]` 4、`text-[10px]` 2。

行高工具：`leading-relaxed`（1.625，30 处 = 正文默认）、`leading-snug`（1.375，6 处）、`leading-tight`（1.25，4 处）、
`leading-none`（1，4 处，纯数字/图标）。字距：`tracking-tight`（-0.025em，15 处，标题专用）、`tracking-wide`（0.025em，2 处）、
`tracking-widest`（0.1em，1 处，页脚分栏标题）、`tracking-[0.18em]`（页面副标题）、`tracking-[0.28em]`（1 处）。
字重：`font-medium` 52 处（默认 UI 字重）、`font-semibold` 7 处（标题）、`font-bold` 1 处（统计数字）。

**角色 → 排版配方（原文类串）**

| 角色 | 配方 |
| --- | --- |
| 首页 hero H1 | `text-2xl font-medium tracking-tight text-text [text-wrap:balance] sm:text-3xl` ＋ 内联 `fontFamily: 'var(--font-mono)'` |
| 内页 H1 | `text-3xl font-semibold tracking-tight text-text` |
| Section H2 | `text-2xl font-semibold tracking-tight text-text sm:text-[1.75rem]`（[SectionHeading.tsx:47](file:///tmp/omarchy-site/src/components/SectionHeading.tsx#L47)） |
| Section 描述 | `mt-2 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]` |
| 子区块标题（月份、团队） | `font-sans text-lg font-medium text-text` |
| 页面副标题（字标下） | `page-subtitle text-center text-xs font-medium tracking-[0.18em] text-brand uppercase sm:text-sm` |
| 正文 | `.prose { font-size: 15px; line-height: 1.65; color: var(--color-text-secondary) }` |
| 卡片正文 | `text-[13px] leading-relaxed text-text-secondary [text-wrap:pretty]` ＋ `line-clamp-2` |
| 卡片标题 | `text-sm font-medium text-text truncate` |
| 卡片元信息 | `font-mono text-xs text-text-muted` |
| 徽章 | `text-xs font-medium`；`.badge__name` = `font-sans 1.125rem font-weight 600 letter-spacing .06em uppercase` |
| 图注 | `font-size: 13px; color: var(--color-text-muted)` |

`.prose` 内部层级（[styles.css:1188-1200](file:///tmp/omarchy-site/src/styles.css#L1188-L1200)）：

```css
.prose h2, .prose h3 {
  color: var(--color-text);
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 2em 0 0.6em;
}
.prose h2 { font-size: 1.25rem; }
.prose h3 { font-size: 1.05rem; }

/* “原则”页专用紧凑标题 */
.prose.principles h2 {
  font-size: 1.125rem; font-weight: 500; line-height: 1.75rem;
  letter-spacing: normal; margin-bottom: 0.5em;
}
.prose.principles h2:not(:first-child) { margin-top: 2.75em; }
```
---

## 4. 间距与布局

### 4.1 度量 token

| token / 类 | 值 | 用途 |
| --- | --- | --- |
| `--measure` | `48rem` (768px) | `.prose` 元素 `max-width`、手册正文列 `lg:max-w-(--measure)` |
| `--nav-h` | `calc(3.5rem + env(safe-area-inset-top, 0px))`＝56px + 刘海 | sticky 栏高、`[id] { scroll-margin-top }`、移动菜单顶位 |
| `max-w-6xl` | `72rem` (1152px) | 页面容器（首页/头部/页脚/手册/团队/集市） |
| `.docs` | `46rem` (736px) | 集市文档列 |
| `.rail-column` 内容列 | `max(1rem, calc((100% - min(100% - 2rem, 69rem)) / 2))`；`≥40rem` 为 `max(1.5rem, calc((100% - min(100% - 3rem, 69rem)) / 2))` | 全出血横向轨道与标题列对齐（最宽 1104px） |
| `max-w-[35.5rem]` / `max-w-2xl` / `max-w-3xl` | 568px / 42rem / 48rem | hero 文案 / 文案块 / 窄版页面 |
| `--pxc` | `calc(min((100cqw - 48px) * 0.88, 896px) / 81)` | 像素栅格列宽（81 列，纯 CSS 推导，无运行时测量） |
| `--pxr` | `calc(var(--pxc) * 50 / 51)` | 像素栅格行高（字标单位 51×50） |

```css
/* styles.css:992-999 */
.pixel-container { container-type: inline-size; }
.pixel-container > * {
  --pxc: calc(min((100cqw - 48px) * 0.88, 896px) / 81);
  --pxr: calc(var(--pxc) * 50 / 51);
}
```

### 4.2 容器与垂直节奏

```html
<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">              <!-- 内页：py-8 = 32px -->
<div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-28">     <!-- 首页区块：48px → 112px -->
<div class="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">     <!-- 首页区块：48px → 96px -->
<div class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">  <!-- 导航栏：56px 高 -->
<div class="footer-rise relative mx-auto max-w-6xl px-4 py-14 sm:px-6">   <!-- 页脚：56px -->
```

| 场合 | 垂直内距 |
| --- | --- |
| 首页 section | `py-12`（48px）→ `lg:py-28`（112px）或 `lg:py-24`（96px） |
| 内页 main | `py-8`（32px）+ 页面头 `pb-8 sm:pb-10`（32→40px） |
| 手册/团队/集市 | `py-12`（48px） |
| 页脚 | `py-14`（56px） |
| 区块内分隔 | `.docs-section { margin-top: 3em; border-top: 1px solid var(--color-border-subtle); padding-top: 2em }` |
| `.ported .team` | `margin-top: 3em; border-top; padding-top: 2em` |
| 章节分页 | `mt-14 border-t border-border-subtle pt-6` |

`@media` 断点两套并存：Tailwind 默认（`sm` 40rem/640px、`md` 48rem、`lg` 64rem/1024px、`xl` 80rem）与手写媒体查询
（`@media (width >= 40rem)`、`@media (min-width: 640px)`、`@media (min-width: 1024px)`、`@media (max-width: 639.98px)`、
`@media (max-width: 480px)`、`@media (max-width: 399px)`、`@media (max-width: 349px)`）。

### 4.3 栅格做法（实测）

| 位置 | 栅格 |
| --- | --- |
| 页脚链接区 | `grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 xl:gap-x-10` |
| 首页 about | `grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-20` |
| 手册 | `grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-8`（侧栏 `border-r border-border-subtle`，`lg:sticky lg:top-[calc(var(--nav-h)+3rem)]`） |
| 团队成员 | `grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]` |
| `.ported .team__members` | `repeat(auto-fill, minmax(9.5rem, 1fr))`，`gap: 2rem 1.25rem` |
| 装机图墙 | `repeat(auto-fill, minmax(15rem, 1fr))`，`gap: 0.75rem`，图片 `aspect-ratio: 4 / 3` |
| 住客条目 | `grid-template-columns: 7.5rem minmax(0, 42rem)`，`gap: 0.35em 1.5rem` |
| 赞助条目 | `grid-template-columns: 6rem minmax(0, 42rem)`，`gap: 0.25em 1.5rem` |
| 文档字段行 | `grid-template-columns: minmax(9rem, 14rem) 1fr`，`gap: 1em`，行间 `border-bottom: 1px solid var(--color-border-subtle)` |
| 赞助人名录 | `repeat(2, minmax(0,1fr))` → `640px: repeat(3,…)` → `1024px: repeat(5,…)` |
| 卡片轨道 | 移动端 `flex snap-x snap-mandatory gap-4 overflow-x-auto`，`sm` 起变 `sm:grid`（[CardRail.tsx:46-53](file:///tmp/omarchy-site/src/components/CardRail.tsx#L46-L53)） |

Spacing 单位是 Tailwind 默认 `--spacing: 0.25rem`，未覆盖。

---

## 5. 边框与阴影

**核心断言：卡片/弹层的"浮起"是 1px 零模糊外描边（box-shadow 不带 `inset`、blur = 0、spread = 1px），不是投影。**

```css
/* styles.css:1042-1057 */
.img-outlined { outline: 1px solid var(--t-img-outline); outline-offset: -1px; }

.ring-elevation { box-shadow: var(--t-elevation); }
.ring-elevation-hover {
  transition-property: box-shadow, background-color;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.ring-elevation-hover:hover { box-shadow: var(--t-elevation-hover); }
```

- 深色主题 = `0 0 0 1px oklch(1 0 0 / 0.07)`，hover 时同结构升到 `/ 0.13`（同一几何、只改 alpha，
  因此 hover 不产生跳动）。
- 面板底用的是 `color-mix` 只改 alpha：`--t-elevation` 的 ring 承担"边框"，元素本身仍可 `bg-surface`、
  不写 `border`（避免 1px 边框参与布局）。
- 因为 ring 画在盒子外侧，父级 `overflow: hidden` 会把它裁掉：卡片因此把 ring 与 `overflow-hidden` 用在一起，
  并另用一层 `absolute inset-0` 画 `focus-visible` 的 inset 描边（见 7.2）。
- 浅色主题才叠加真实投影（1px ring + `0 1px 3px` + `0 4px 10px -4px`），见 1.5-B。

**描边宽度规范**

| 用途 | 值 |
| --- | --- |
| 发丝线（分隔、表格、卡片内） | `1px solid var(--color-border-subtle)`（`border-t` / `border-b` / `border-b` 单边） |
| 控件描边 | `1px`，`border-border-strong`（输入框、outline 按钮、Select） |
| 强调容器 | `2px`，`border-2 border-border-strong`（搜索面板 [SearchPalette.tsx:299](file:///tmp/omarchy-site/src/components/SearchPalette.tsx#L299)） |
| 引用块 / 提示块左线 | `border-left: 2px solid var(--color-brand)`；`.prominent-callout` 用 `--color-tn-orange` |
| 图片 | `outline: 1px solid var(--t-img-outline); outline-offset: -1px`（`.img-outlined`） |
| 头像 | `ring-1 ring-border-subtle`（团队头像）、`ring-2`（TeamClusters 选中态） |
| 芯片/徽章 | `border-brand/40`、`border-current/25`（kbd） |

**真实阴影（例外，5 处）**：`shadow-sm`（tabs 激活项）、`shadow-xl`（地图卡片 [MeetupMap.tsx:264](file:///tmp/omarchy-site/src/components/MeetupMap.tsx#L264)）、
`shadow-2xl`（主题选择器卡）、`shadow-none`（tabs line 变体）、`drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]` /
`drop-shadow-[0_1px_6px_rgb(0_0_0/0.7)]`（媒体上的图标）。其余一律走 `ring-elevation`。

**滚动条**：两套实现。

```css
/* 强调型滚动条（用于搜索面板、手册 TOC 等） */
.scroll-accent {
  scrollbar-width: thin;
  scrollbar-color: var(--t-brand) color-mix(in oklch, var(--t-border-subtle) 50%, transparent);
}
.scroll-accent::-webkit-scrollbar { width: 8px; height: 8px; }
.scroll-accent::-webkit-scrollbar-track { background: color-mix(in oklch, var(--t-border-subtle) 50%, transparent); }
.scroll-accent::-webkit-scrollbar-thumb { background: var(--t-brand); }
.scroll-accent::-webkit-scrollbar-thumb:hover  { background: var(--t-field-hover); }
.scroll-accent::-webkit-scrollbar-thumb:active { background: var(--t-field-crest); }

/* 轨道自带进度条的横向轨道：隐藏原生滚动条 */
.rail-bare { scrollbar-width: none; }
.rail-bare::-webkit-scrollbar { display: none; }
```

自绘轨道条：轨道 `h-2 bg-border-subtle/50`，滑块 `h-full bg-brand`（[CardRail.tsx:56-61](file:///tmp/omarchy-site/src/components/CardRail.tsx#L56-L61)）；
拖拽滑块 `h-full cursor-grab bg-brand hover:bg-(--t-field-hover) active:cursor-grabbing active:bg-(--t-field-crest)`
（[Rail.tsx:429](file:///tmp/omarchy-site/src/components/Rail.tsx#L429)）。

---

## 6. z-index 层级规范

```css
@theme {
  /* z-index scale: no arbitrary values anywhere else */
  --z-nav: 100;
  --z-dropdown: 200;
  --z-modal: 300;
  --z-tooltip: 400;
}
```

用 Tailwind 的"变量简写"工具类消费：`z-(--z-nav)`、`z-(--z-dropdown)`、`z-(--z-modal)`、`z-(--z-tooltip)`。

| 层 | 值 | 使用者 |
| --- | --- | --- |
| nav | `100` | `SiteHeader` 的 `header.sticky`、`HeroNavGhost`（`fixed … mix-blend-difference`） |
| dropdown | `200` | 主题切换提示卡、音乐控制条、EtchPicker |
| modal | `300` | SearchPalette、ThemePicker（遮罩与卡片层）、跳转链接（`z-(--z-modal)`） |
| tooltip | `400` | `TooltipContent` 的 Positioner（[tooltip.tsx:46](file:///tmp/omarchy-site/src/components/ui/tooltip.tsx#L46)） |

其余层级：

- `#main` = `relative z-10`（压过全屏背景 canvas）。
- TeamClusters 悬停/选中头像 `z-index: 60`（局部，只在簇内比较）。
- ThemePicker 卡片用内联 `zIndex: 10 - depth`（牌堆深度）。
- 搜索行、卡片链接的点击热区用 `before:z-10`。
- **不一致处（需注意）**：shadcn 桥接组件内部仍用裸 `z-50`（Dialog overlay/content、Select 弹层与其滚动按钮、
  Tooltip 弹层与箭头），数值 50 **低于** `--z-nav`(100)。这些组件在当前站点基本未启用（Dialog 未使用、
  Select/Badge 仅在 `src/parked/**` 里），复刻时若启用需改成 `z-(--z-modal)` 一族。
---

## 7. 组件样式规则

> 组件实现统一用 Base UI（`@base-ui/react`）而非 Radix，变体用 `class-variance-authority`，类名合并用 `cn()`（`@/lib/utils`）。

### 7.1 按钮 `src/components/ui/button.tsx`

基础串（原文，[button.tsx:8](file:///tmp/omarchy-site/src/components/ui/button.tsx#L8)）：

```
group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent
bg-clip-padding font-medium whitespace-nowrap outline-none
transition-[background-color,border-color,color,transform] duration-150 ease-out select-none
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring
active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive
[&_svg]:pointer-events-none [&_svg]:shrink-0
```

要点：`rounded-lg` = 0 圆角；`border border-transparent` 让幽灵层占位不抖动（见 7.3）；
按下反馈用 `active:scale-[0.96]`（缩放而非位移）；过渡只列 4 个属性，150ms ease-out。

**变体（6 个）**

| variant | 类 | 视觉 |
| --- | --- | --- |
| `default` | `bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--color-primary),white_14%)]` | brand 实填 + `brand-ink` 文字；hover 向白混 14%。源码注明实色填是为"让 hero 动画不穿透控件" |
| `outline` | `border-border-strong bg-surface text-text hover:bg-surface-2 aria-expanded:bg-surface-2` | 1px `border-strong` 描边 + surface 底 |
| `secondary` | `bg-surface-2 text-text hover:bg-[color-mix(in_oklch,var(--color-surface-2),var(--color-text)_8%)] aria-expanded:bg-surface-2` | 抬高面；hover 混入 `text` 8% |
| `ghost` | `text-text hover:bg-surface-2 aria-expanded:bg-surface-2` | 无底，仅 hover 面（图标按钮默认） |
| `destructive` | `bg-destructive/10 text-destructive hover:bg-destructive/20` | 10% 红底 + 红字 |
| `link` | `text-primary underline-offset-4 hover:underline` | 文本链接 |

**尺寸（8 个）**

| size | 类 |
| --- | --- |
| `xs` | `h-8 gap-1.5 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4` |
| `sm` | `h-9 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4` |
| `default` | `h-10 gap-2 px-4 text-sm has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 [&_svg:not([class*='size-'])]:size-5` |
| `lg` | `h-11 gap-2 px-5 text-[15px] has-data-[icon=inline-end]:pr-4.5 has-data-[icon=inline-start]:pl-4.5 [&_svg:not([class*='size-'])]:size-5` |
| `icon-xs` | `size-8 [&_svg:not([class*='size-'])]:size-4` |
| `icon-sm` | `size-9 [&_svg:not([class*='size-'])]:size-4` |
| `icon` | `size-10 [&_svg:not([class*='size-'])]:size-5` |
| `icon-lg` | `size-11 [&_svg:not([class*='size-'])]:size-5` |

尺寸阶梯 **32 / 36 / 40 / 44px**（`h-8`=2rem、`h-9`=2.25rem、`h-10`=2.5rem、`h-11`=2.75rem），内距 **10 / 12 / 16 / 20px**。
导航栏里的按钮被覆盖为 `h-8`（`lg` 起 `lg:h-[calc(var(--pxr)*3)]` 贴合像素栅格）。

命中区扩展统一用伪元素：`before:absolute before:-inset-1`（图标按钮）、`before:-inset-y-1.5`（安装按钮）、
`before:-inset-2`（复制按钮）。

**同族文本按钮**（不是 Button 组件，视觉同源）：

```ts
// src/astro/pages/HomePage.tsx:94-96
const sectionLink =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 py-2 text-sm font-medium whitespace-nowrap
   text-text underline decoration-current underline-offset-4 transition-colors duration-150
   hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring
   [&_svg]:size-5 [&_svg]:shrink-0'
```

### 7.2 卡片

统一配方（[ThemeCard.tsx:18-49](file:///tmp/omarchy-site/src/components/ThemeCard.tsx#L18-L49)、
[PluginCard.tsx:20-95](file:///tmp/omarchy-site/src/components/PluginCard.tsx#L20-L95)）：

```tsx
<article className="ring-elevation ring-elevation-hover group relative flex flex-col overflow-hidden rounded-xl bg-surface">
  <div className="relative aspect-video w-full overflow-hidden bg-bg-deep">
    <img className="img-outlined size-full object-cover" … />
  </div>
  <div className="flex flex-1 flex-col gap-1.5 p-4">
    <h3 className="min-w-0 truncate text-sm font-medium text-text">
      <a href={…} className="focus-visible:outline-none">
        <span className="absolute inset-0" aria-hidden="true" />   {/* 整卡热区 */}
        {name}
      </a>
    </h3>
    <p className="font-mono text-xs text-text-muted">{author}</p>
  </div>
  {/* 焦点环内缩，避免被卡片自身的 overflow 裁掉 */}
  <div aria-hidden="true"
       className="pointer-events-none absolute inset-0 rounded-xl group-has-[a:focus-visible]:-outline-offset-2 group-has-[a:focus-visible]:outline-2 group-has-[a:focus-visible]:outline-ring" />
</article>
```

固定点：媒体井（`aspect-video bg-bg-deep` + `.img-outlined`）+ 内容区（`p-4 gap-1.5`）；描边 `ring-elevation`；
hover `ring-elevation-hover`（只改 ring alpha，不加位移）；交互 = 拉伸链接 + inset 焦点环；文字 = 标题
`text-sm font-medium`、描述 `text-[13px] leading-relaxed text-text-secondary` + `line-clamp-2`、元信息 `font-mono text-xs text-text-muted`。

其他卡片形态：

| 卡片 | 差异 |
| --- | --- |
| Voices 引用卡 | `flex w-full flex-col gap-3 p-4 sm:p-5`，瀑布流竖排 `mb-4 break-inside-avoid` |
| `.prose pre` / `.docs .code-block` | `background: var(--color-bg-deep); box-shadow: var(--t-elevation)`；`padding: 1em 1.25em`；`overflow-x: auto`；`.code-head` = `font-mono 12px text-text-muted padding 0.5em 1em border-bottom 1px border-subtle` |
| 安装命令条 | `ring-elevation flex min-w-0 items-center gap-1 rounded-lg bg-bg-deep py-1.5 pr-1.5 pl-4`；命令 `font-mono text-[11px] sm:text-sm`；`$` 前缀 `text-brand select-none` |
| 音乐控制卡 | `fixed bottom-5 left-5 z-(--z-dropdown) hidden h-[46px] items-stretch border border-border-subtle bg-bg/85 backdrop-blur-sm sm:flex`；封面按钮 `size-11 border-r border-border-subtle` |
| 404 / hero 面板 | `pixel-container relative -mt-(--nav-h) flex min-h-svh flex-col overflow-hidden border-b border-border-subtle` + `style={{ background: 'var(--t-field-bg)' }}` |

### 7.3 导航栏 `src/components/SiteHeader.tsx`

```tsx
<header dir="ltr" className="pixel-container sticky top-0 z-(--z-nav)">
  <div ref={bar} data-nav-blend={transparent ? '' : undefined}
       className={cn('group/bar', menuOpen && 'bg-bg/95 backdrop-blur-lg')}
       style={{
         paddingTop: 'env(safe-area-inset-top)',
         backgroundColor: 'color-mix(in srgb, var(--nav-ground, var(--color-bg)) calc(var(--nav-surface, 0) * var(--nav-fill, 1) * 90%), transparent)',
         backdropFilter: 'blur(calc(var(--nav-surface, 0) * 12px))',
       }}>
    <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
```

| 元素 | 规则 |
| --- | --- |
| 栏体 | 高 `3.5rem`(56px) + `safe-area-inset-top`；`max-w-6xl px-4 sm:px-6`；`gap-3`；`sticky top-0 z-(--z-nav)` |
| 栏底 | 由滚动位置驱动：`--nav-surface`(0/1) × `--nav-fill`(0–1) × 90% 地面色，叠加模糊；越过 hero 后挂 `data-nav-past-hero` |
| 过滤器 | `blur(var(--nav-surface,0) * 12px)`——hero 上方强制 0 模糊（"Keep blur off over the hero so its pixels stay sharp"） |
| 导航链接 | `px-3 py-1.5 text-sm whitespace-nowrap text-text-secondary transition-[background-color] duration-150 ease-out hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` |
| 当前页链接 | `activeProps={{ className: 'text-text bg-surface-2' }}` |
| 图标按钮 | `Button variant="ghost" size="icon"` + 覆盖 `relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]` |
| 安装按钮 | `h-8 px-4 before:absolute before:-inset-y-1.5 lg:h-[calc(var(--pxr)*3)]`（主按钮变体） |
| 图标尺寸 | 常规 `size-5`；小屏 logo `size-[22px]`，`lg` 起 `size-[calc(var(--pxc)*2)]` |
| 移动端菜单 | 面板 `absolute inset-x-0 top-(--nav-h) border-b border-border-subtle bg-bg/95 backdrop-blur-lg sm:hidden`；行 `py-3 text-[15px] text-text-secondary`；遮罩 `absolute inset-x-0 top-(--nav-h) h-svh bg-black/55 backdrop-blur-xs sm:hidden` |
| 混合幽灵层 | `HeroNavGhost`：`pointer-events-none fixed inset-x-0 top-0 z-(--z-nav) mix-blend-difference`，标签色 `var(--t-hdr-text-2)`；`[data-nav-blend]` 下真实标签 `color: transparent` 且禁用 hover 底色（[styles.css:1131-1148](file:///tmp/omarchy-site/src/styles.css#L1131-L1148)） |
| 窄屏投影 | `@media (max-width: 639.98px) { html:not([data-nav-menu='open']) [data-nav-past-hero] { box-shadow: inset 0 -1px 0 var(--color-border-subtle) } }` |
| 提示 | `TooltipProvider delay={300}` + `TooltipContent side="bottom" sideOffset={10}`；快捷键 `<kbd className="ml-1 rounded border border-current/25 px-1 font-mono text-[11px] opacity-75">` |

### 7.4 链接

四种配方并存，按出现位置选择：

```css
/* 1) 正文链接：常驻下划线，hover 只换下划线颜色 */
.prose a {
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: var(--color-border-strong);
  text-underline-offset: 3px;
  text-decoration-skip-ink: auto;
  transition: text-decoration-color 150ms ease-out;
}
.prose a:hover { text-decoration-color: var(--color-brand); }
```

```ts
// 2) 页脚/注脚：静止无下划线，hover 同时显色与线
const footerLink = `text-text-secondary underline decoration-transparent underline-offset-4
  transition-colors duration-150 ease-out hover:text-brand hover:decoration-current ${focusRing}`

// 3) 说明文内链接（HomePage noteLink）
const noteLink = 'text-text-secondary underline decoration-border-strong underline-offset-4
  transition-colors duration-150 ease-out hover:text-text hover:decoration-brand'

// 4) 成员名 / Voices 内链：无下划线 → hover 有
'text-text underline decoration-transparent underline-offset-3 transition-[text-decoration-color] duration-150 ease-out hover:decoration-brand'
```

标题锚点链接保留下划线占位，只让 `#` 淡入：

```css
.manual__hash { display: inline-block; margin-left: 0.35em; color: var(--color-text-muted); opacity: 0; transition: opacity 150ms ease-out; }
.manual__heading-link:hover .manual__hash,
.manual__heading-link:focus-visible .manual__hash { opacity: 1; }
```
### 7.5 表格

线上只有正文表格一种（`.prose table`，[styles.css:1302-1319](file:///tmp/omarchy-site/src/styles.css#L1302-L1319)）：

```css
.prose table { border-collapse: collapse; width: 100%; margin: 1.25em 0; font-size: 14px; }
.prose th, .prose td { border: 1px solid var(--color-border-subtle); padding: 0.5em 0.75em; text-align: left; }
.prose th { color: var(--color-text); font-family: var(--font-sans); font-weight: 600; background: var(--color-surface); }
```

字段清单式"伪表格"用 dl + grid（`.docs .field-row`、`.docs .manifest-reference dl > div`）：

```css
.docs .field-row {
  display: grid;
  grid-template-columns: minmax(9rem, 14rem) 1fr;
  gap: 1em; padding: 0.6em 0;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: 14px;
}
.docs .field-row dt { font-family: var(--font-mono); font-size: 13px; color: var(--color-text); }
```

### 7.6 输入框与表单控件

线上在用的输入框是 `SearchField`（[SearchField.tsx:42-47](file:///tmp/omarchy-site/src/components/SearchField.tsx#L42-L47)）：

```tsx
<input className="h-10 w-full border border-border-strong bg-bg-deep pl-10 text-base text-text placeholder:text-text-muted
                  transition-[border-color] duration-150 ease-out hover:border-border-strong
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
       type="search" spellCheck={false} autoComplete="off" autoCorrect="off" enterKeyHint="search" />
```

- 高 `2.5rem`(40px)，1px `border-strong` 描边，`bg-bg-deep` 凹槽底，无圆角；左侧 `pl-10`(40px) 留给 20px 图标
  （`SearchIcon` = `absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted`）。
- 无可见标签，靠 `aria-label`；`:focus-visible` 与全站同款 2px outline。
- 搜索面板内部改为 `min-w-0 flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:text-text placeholder:opacity-60 [&::-webkit-search-cancel-button]:hidden`，
  外框由面板自己画 `border-2 border-border-strong`。

shadcn `Input`（未在线上使用，保留为桥接）：

```
h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none
file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50
disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50
aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm
dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40
```

`SelectTrigger`（`src/parked/**` 在用）：

```
flex w-fit items-center justify-between gap-2 rounded-lg border border-border-strong bg-bg-deep px-3
text-sm whitespace-nowrap transition-[background-color,border-color] duration-150 ease-out outline-none select-none
hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring
data-placeholder:text-text-muted data-[size=default]:h-10 data-[size=sm]:h-9
```

即：**表单控件 = `bg-bg-deep` + `border-strong` + 40px 高**，与按钮的 `bg-surface` 明确区分。
`Toggle` 尺寸：`h-8 min-w-8 px-2.5`（default）、`h-7 min-w-7`（sm）、`h-9 min-w-9`（lg）；
`ToggleGroup` 间距由 `--gap`（默认 2）→ `gap-[--spacing(var(--gap))]`。

### 7.7 徽章与芯片

shadcn `Badge`（[badge.tsx:9](file:///tmp/omarchy-site/src/components/ui/badge.tsx#L9)，仅 `src/parked/**` 使用）：

```
inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl
border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all
focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:size-3!
```

变体：`default`(brand 实填) / `secondary`(surface-2) / `destructive`(10% 红) / `outline`(`border-border`) / `ghost` / `link`。

线上实际的"芯片"三例：

```tsx
// 1) hero 公告条（HomePage.tsx:203）
'group inline-flex max-w-full items-center gap-2 border border-brand/40 bg-bg/60 px-3.5 py-1.5 text-left
 font-mono text-[13px] leading-snug text-brand transition-colors duration-150 ease-out
 hover:border-brand hover:bg-brand hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

// 2) 地区筛选芯片（MeetupsPage.tsx:208-221）：选中 = 反转填色
'border-brand bg-brand text-brand-ink'  // 选中
'border-border-strong bg-surface text-text hover:bg-surface-2'  // 未选中
// 外层：'inline-flex min-h-11 items-center gap-2 border px-3 text-sm transition-colors sm:min-h-9 duration-150 ease-out'
// 计数：'font-mono text-xs' + (on ? 'text-brand-ink/70' : 'text-text-muted')

// 3) 元信息徽章（PluginCard 统计）
'm-auto flex shrink-0 items-center gap-2.5 font-mono text-xs text-text-muted tabular-nums'
```

"反转填色"是表达选中的标准手法：`border-brand bg-brand text-brand-ink`（靠 `--t-brand-ink` 保证对比度）。

### 7.8 浮层：tooltip / dialog / select / tabs / scroll-area

| 组件 | 关键类（原文要点） |
| --- | --- |
| `TooltipContent` | `inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background`；箭头 `size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground`；定位器 `isolate z-(--z-tooltip)`；进出动画 `fade-in-0 zoom-in-95` / `fade-out-0 zoom-out-95`；`data-[side=…]:slide-in-from-*` |
| `DialogOverlay` | `fixed inset-0 isolate z-50 bg-black/10 duration-100 backdrop-blur-xs`（`supports-backdrop-filter:` 条件） |
| `DialogContent` | `fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 sm:max-w-sm`；关闭按钮 `variant="ghost" size="icon-sm"` 绝对定位 `top-2 right-2` |
| `SelectContent` | `bg-surface p-1 text-text ring-elevation duration-100` + `data-open:animate-in … zoom-in-95`；单项 `py-1.5 pr-8 pl-2.5 text-sm focus:bg-surface-2 focus:text-text` |
| `TabsList` | `inline-flex w-fit rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8`；`default` = `bg-muted`，`line` = `gap-1 bg-transparent` |
| `TabsTrigger` | `h-[calc(100%-1px)] rounded-md px-1.5 py-0.5 text-sm font-medium text-foreground/60 hover:text-foreground data-active:bg-background data-active:text-foreground`；line 变体的下划线指示器 `after:absolute after:bg-foreground after:opacity-0 group-data-horizontal/tabs:after:inset-x-0 after:bottom-[-5px] after:h-0.5` |
| `ScrollArea` | 视口 `rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1`；可选 `mask-t/b/l/r-from-…` 淡出（`--fade-size:1.5rem`）；滚动条 `w-1.5 / h-1.5`，`opacity-0` → `data-hovering/data-scrolling:opacity-100`，滑块 `bg-foreground/20` |
| `Separator` | `bg-border`，水平 `h-px w-full`，垂直 `w-px self-stretch` |
| `Skeleton` | `animate-pulse rounded-md bg-muted`（未使用） |

### 7.9 站点专有组件（这套语言的"签名"部分）

| 组件 | 规则 |
| --- | --- |
| 搜索面板 `SearchPalette` | 面板 `relative flex max-h-[70vh] w-full max-w-[340px] flex-col border-2 border-border-strong bg-surface p-[18px]`；遮罩 `absolute inset-0 bg-bg/60 backdrop-blur-xs`；内容区 `scroll-accent -mx-1 mt-1.5 min-h-0 flex-1 overflow-y-auto px-1`；行 `flex w-full items-center gap-3 px-3`（命中行 `py-2.5`，菜单行 `h-[40px]`）；行选中 `bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] text-brand`；行内文字 `font-mono text-[13px]`，快捷键 `font-mono text-[10px] tracking-wide text-text-muted uppercase`；高亮 `<mark className="bg-transparent font-medium text-brand">` |
| 主题选择器 `ThemePicker` | 卡片用 `clipPath: polygon(2.5% 0%, 100% 0%, 97.5% 100%, 0% 100%)`（10° 斜切平行四边形）；边框由"外框 `bg-brand` + `clipPath` + 内层 inset 3px（前排）/1px（侧排）`bg-black`"两层叠出；侧卡 `scale(0.88)`、`brightness(var(--card-dim))`（`--card-dim` 0.55 → hover 0.78）；横向错位 `Math.sign(offset) * (6 + depth * 12)`%；`zIndex: 10 - depth`；卡片宽 `w-[min(68vw,46rem)]` / `sm:w-[min(72vw,46rem)]`；只渲染 |offset| ≤ 2 的卡；整层 `viewTransitionName: 'theme-picker'` |
| 音乐卡 `MusicControl` | 见 7.2；进度条 `w-[3px] bg-brand`，底部细线 `absolute inset-x-0 bottom-0 h-[2px] origin-left bg-brand`；环形提示 `music-ring` 动画 1.8s；range 轨道 14px 透明，thumb 1px 宽不可见 |
| 横向轨道 `Rail` / `CardRail` | `.rail-column` 全出血对齐；`.rail-bare` 隐藏原生滚动条；自绘进度条轨道 `h-2 bg-border-subtle/50` + 滑块 `bg-brand`；拖拽滑块 `hover:bg-(--t-field-hover) active:bg-(--t-field-crest)` |
| 团队头像簇 `TeamClusters` | `--team-face: 44px`（`≤399px` → 40px，`≤349px` → 36px）、`--team-gap: 8px`（窄屏 6px）；叠放位移 `translateX(calc(var(--i) * -20px + var(--shift)))`；选中/悬停 `scale: 1.15`，相邻让位 `--shift: ±14px`；`z-index: var(--z)`，抬升时 60；过渡 `320ms cubic-bezier(0.33, 1, 0.68, 1)` |
| 版本/统计大数字 | `h-10 font-sans text-6xl leading-none font-bold text-brand` |
| 像素标签 `PixelLabel` | 3×5 点阵字（`GLYPH_WIDTH=3`、`GLYPH_HEIGHT=5`、`TRACKING=1`、`SPACE_WIDTH=2`），`cell=3px`，`shapeRendering="crispEdges"`，`role="img"` + `aria-label` |
| 图片井 | `bg-bg-deep` + `img-outlined`（1px 内描边）+ `object-cover` |
---

## 8. 动效

### 8.1 时长与缓动（全仓统计）

| 值 | 次数 | 用途 |
| --- | --- | --- |
| `duration-150` + `ease-out` | 56 / 72 | **默认**：hover 变色、背景、下划线、ring 变化 |
| `duration-100` | 5 | 浮层进入/退出（dialog、select 的自带动画） |
| `duration-200` | 4 | 局部过渡 |
| `duration-300` | 4 | 提示条、notice 进 |
| `ease-in-out` / `ease-in` | 6 / 5 | 展开收拢、遮罩 |

CSS 里手写的定时（[styles.css](file:///tmp/omarchy-site/src/styles.css)）：

| 名称 | 时长 / 曲线 | 对象 |
| --- | --- | --- |
| `.ring-elevation-hover` | `150ms ease-out`（`box-shadow, background-color`） | 卡片层级描边 |
| `typed-blink` | `1.06s step-end infinite` | 打字光标 |
| `caret-blink` | `1.1s steps(1) infinite` | hero 光标 |
| `meetup-pin-in` | `300ms ease-out both` | 地图图钉；卡片 120ms |
| `music-ring` | `1.8s ease-in-out infinite` | 音乐提示环（opacity 1 → 0.3） |
| `notice-in` | `300ms ease-out both` | 提示条（`translateX(12px)` + 淡入） |
| `canvas-warmup` | `900ms ease-out both` | hero canvas 淡入 |
| `mark-draw` / `mark-draw-back` | `650ms cubic-bezier(0.45, 0, 0.25, 1)`，分段 110/470/70/70ms，延迟 250/360/540/600ms | 导航标志描边 |
| `team-named` | `200ms ease-out both` | 名字浮入（`translate: 0 2px`） |
| `hero-rise` | `550ms cubic-bezier(0.21, 0.47, 0.32, 0.98) both`，`animation-delay: calc(var(--stagger, 0) * 90ms)` | hero 元素错峰上浮（`translateY(14px)` → 0） |
| `.voices` 展开 | `max-height 400ms ease-in-out, --voices-band 400ms ease-in-out`（`@property --voices-band`，260px → 0px） | 折叠区展开 |
| `.team-*` | `--team-time: 320ms`、`--team-ease: cubic-bezier(0.33, 1, 0.68, 1)` | 头像簇收放 |
| 平滑滚动 | `html { scroll-behavior: smooth }` | 锚点跳转（`prefers-reduced-motion` 下改 `auto`） |

**主题切换必须静止**（否则每个颜色各自补间）：

```css
/* styles.css:1036-1040 */
.no-transitions,
.no-transitions * { transition: none !important; }
```

**Motion（JS 动画）**只在 `InstallCommand` 用：`swapTransition = { type: 'spring', duration: 0.3, bounce: 0 }`，
勾号路径 `{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }`，且全部经 `useReducedMotion()` 降级为 `{ duration: 0 }`。

### 8.2 主题切换动画（`src/theme-transition.css` + `src/lib/theme-transition.ts`）

机制：**View Transitions API + 一条 10° 斜切"裂缝"遮罩（split wipe），200ms 打开，旧页面快照带 4px 磨砂。**

```css
/* 1) 用 @property 让裂缝宽度可被 keyframes 补间 */
@property --theme-wipe { syntax: '<length-percentage>'; inherits: false; initial-value: 0px; }

/* 2) 接管 VT 伪元素几何：铺满视口、不裁剪内容、不动画（动画只由 --theme-wipe 驱动） */
::view-transition { position: fixed; inset: 0; overflow: clip; pointer-events: none; filter: none; }
::view-transition-group(root) { animation: none; position: absolute; inset: 0; overflow: hidden; }
::view-transition-image-pair(root) { animation: none; inset: 0; overflow: hidden; }
::view-transition-old(root), ::view-transition-new(root) {
  animation: none; mix-blend-mode: normal; opacity: 1; inset: 0;
  width: 100%; height: 100%; object-fit: none; object-position: 0 0; filter: none;
}
::view-transition-new(root) { z-index: 0; }

/* 3) 裂缝：100deg 的平行四边形缝，中心 ±var(--theme-wipe) ∓1px 之外才是旧页面 */
::view-transition-old(root), ::view-transition-old(theme-picker) {
  animation: theme-split-wipe 200ms cubic-bezier(0.7, 0, 1, 1) both;
  mask-image: linear-gradient(
    100deg,
    #000 0,
    #000 calc(50% - var(--theme-wipe) + 1px),
    #0000 calc(50% - var(--theme-wipe) + 1px),
    #0000 calc(50% + var(--theme-wipe) - 1px),
    #000 calc(50% + var(--theme-wipe) - 1px),
    #000 100%
  );
  mask-mode: alpha; mask-size: 100% 100%; mask-repeat: no-repeat;
}
::view-transition-old(root) { z-index: 1; }

/* 4) 只有从选择器里换主题时旧页才磨砂（此时旧页本来就戴着 4px 模糊） */
:root.theme-wipe-frosted::view-transition-old(root) { filter: blur(4px); }

/* 5) 选择器自己是一层（view-transition-name: theme-picker），叠在最上、不受研磨影响 */
::view-transition-group(theme-picker) { animation: none; position: absolute; inset: 0; width: auto; height: auto; transform: none; z-index: 2; }

@keyframes theme-split-wipe {
  from { --theme-wipe: 0px; }
  to   { --theme-wipe: 80%; }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root), ::view-transition-new(root), ::view-transition-old(theme-picker) { animation: none; }
}

/* 6) 页面导航不做这道裂缝：立即交换 */
:root[data-astro-transition]::view-transition-old(root) { animation: none; mask-image: none; opacity: 0; }
```

JS 侧（[theme-transition.ts:39-73](file:///tmp/omarchy-site/src/lib/theme-transition.ts#L39-L73)）：
`runThemeViewTransition(update, doc, reducedMotion, frosted)` 在缺少 `document.startViewTransition` 或用户要求减弱
动效时**直接 `update()` 同步切换**；`frosted` 时给根节点加 `.theme-wipe-frosted` 并在过渡 `finished` 后移除。
选中器层通过 React 内联 `style={{ viewTransitionName: 'theme-picker' }}` 声明（[ThemePicker.tsx:311](file:///tmp/omarchy-site/src/components/ThemePicker.tsx#L311)）。
另有 `astro:before-swap` 里 `viewTransition.skipTransition()`，让页面跳转走即时切换。

时长与曲线：**200ms / `cubic-bezier(0.7, 0, 1, 1)`**（快出慢收）；裂缝终点 `80%`；斜切角 `100deg`（离竖直 10°，顶边向右倾 `/`）；
遮罩边缘用 `±1px` 补偿防走样。

---

## 9. 可访问性做法

### 9.1 焦点可见

```css
/* styles.css:947-958 */
/* Use --t-brand directly: @theme inline tokens are not runtime custom properties. */
@layer base {
  :focus-visible { outline: 2px solid var(--t-brand); outline-offset: 2px; }
}
/* Inset focus outlines to avoid clipping inside scroll containers. */
.rail-bare :focus-visible { outline-offset: -2px; }
```

- 统一规格：**2px 实线、`--t-brand`、偏移 2px**。原因写在 `--color-ring` 处："Use the accent to meet the 3:1
  focus-indicator contrast requirement."（[:126-127](file:///tmp/omarchy-site/src/styles.css#L126-L127)）
- 工具类写法统一为 `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`
  （`focusRing` 常量在页脚复用）；`outline-solid` 只在 button / SelectTrigger 显式写上。
- 滚动容器内改内缩：`.rail-bare :focus-visible { outline-offset: -2px }`；卡片用
  `group-has-[a:focus-visible]:-outline-offset-2`（拉伸链接场景）；音乐卡封面用
  `focus-visible:-outline-offset-2`。
- 组合头像卡的整卡焦点：`.ported .member:has(a:focus-visible) { outline: 2px solid var(--t-brand); outline-offset: 2px }`
  且内部 `a:focus-visible { outline: none }`，避免双环。
- 拉伸链接本身 `focus-visible:outline-none`，焦点环由外层 `absolute inset-0` 的兄弟节点绘制。

### 9.2 结构、语义与屏幕阅读器

- 跳转链接（[Base.astro:86-91](file:///tmp/omarchy-site/src/layouts/Base.astro#L86-L91)）：
  `absolute left-4 z-(--z-modal) -translate-y-[120%] px-3 py-2 text-sm font-medium underline`，
  `focus:translate-y-4` 才进入视口。
- 隐藏文本用 Tailwind `sr-only`；另有手写 `.docs .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%) }`。
- 装饰层全部 `aria-hidden="true"`（幽灵导航、拉伸链接热区、遮罩、canvas、点阵字标容器等）；点阵字与字标用
  `role="img"` + `aria-label`。
- 交互态用真实属性而非视觉类：`aria-pressed`（音乐开关、地区筛选）、`aria-expanded`（菜单）、
  `aria-invalid`（表单）、`data-active`/`aria-selected`。
- 搜索命中数量用 `aria-live="polite"` 播报；无结果文案为真实文本节点。
- 移动端目录用原生 `<details>/<summary>`；章节导航是 `<nav aria-label="Manual chapters">` + `<ol>`。

### 9.3 减弱动效（`prefers-reduced-motion`）

CSS 里 11 处（styles.css）+ 1 处（theme-transition.css），JS 里 10 处消费（`useReducedMotion` 或 `matchMedia`）：

| 位置 | 处理 |
| --- | --- |
| `html` 平滑滚动 | `scroll-behavior: auto` |
| 打字光标 `.typed-caret` | `display: none` |
| hero 光标 / `meetup-pin-in` / `music-ring` / `notice-in` / `canvas-warmup` / `hero-rise` / `team-named` / `mark-draw` | `animation: none` |
| 头像簇 `.team-faces/.team-face/.team-face a` | `transition: none` |
| `.voices` 展开 | `transition: none` |
| 主题切换裂缝 | `::view-transition-old/new(root)`、`old(theme-picker)` 全部 `animation: none`；JS 侧直接同步 `update()` |
| 平滑锚点滚动（`hash-scroll.ts`、`anchor-scroll.ts`） | `behavior: 'auto'` |
| 打字机、像素场、Figures、Rail 拖拽、InstallCommand | 通过 `matchMedia('(prefers-reduced-motion: reduce)')` / `useReducedMotion()` 关闭 |

### 9.4 `color-scheme`、对比度与其他

- 每个主题块都声明 `color-scheme: dark` 或 `color-scheme: light`（22 处一致），让原生控件、滚动条、表单
  跟随主题明暗。
- 文字层级靠**三档实色**（`text` / `text-secondary` / `text-muted`）而非透明度，避免与背景叠加后不可控；
  浅色主题的 `text-muted` 普遍比 `text-secondary` 更深（如 white：`#4a4a4a` vs `#383838` 的反向关系说明
  各 token 是独立挑的，不是同一色的 alpha 派生）。
- 选中/禁用状态用 `--t-brand-ink`、`opacity-50`，不依赖颜色对比本身。
- `a, button, input, select, textarea, [role='button'] { touch-action: manipulation }`（去掉 300ms 双击缩放等待）。
- `[id] { scroll-margin-top: var(--nav-h) }`，手册章节再加 `3rem`（`.manual-chapter [id]`），保证锚点不被粘性栏遮住。
- 平滑滚动与粘性栏配合：`.rail-column` 同时设 `padding-inline` 与 `scroll-padding-inline`，让键盘横向滚动停在内容列。
- `<meta name="theme-color" content="#1a1b26">`（固定为 tokyo-night 的 `bg`）；favicon 由 JS 按当前 `--color-brand`
  重绘 SVG（[theme.ts:41-56](file:///tmp/omarchy-site/src/lib/theme.ts#L41-L56)）。
- 语言方向：`html[dir='rtl']` 下 `code/pre/kbd` 强制 `direction: ltr; unicode-bidi: isolate; text-align: left`
  （[international.css](file:///tmp/omarchy-site/src/i18n/international.css)）。
---

## 10. Tailwind v4 组织方式

### 10.1 入口与指令顺序（`src/styles.css:1-6`）

```css
@import 'tailwindcss';
@import 'tw-animate-css';        /* v1.4.0 —— 提供 animate-in / fade-in-0 / zoom-in-95 等进出场工具 */
@import './theme-transition.css';

/* Archived routes do not contribute utilities to the live site. */
@source not './parked';
```

- **没有 `tailwind.config.js`**（`components.json` 里 `tailwind.config: ""`），全部配置在 CSS 内完成。
- `@source not './parked'` 把存档路由排除出类名扫描。
- **没有 `@plugin`、没有 `@custom-variant`、没有 `@utility`、没有 `@layer utilities`**。自定义类只出现在
  `@layer components`（`.rail-column`）和 `@layer base`（`:focus-visible`），其余是顶层普通规则。
- 因此 Tailwind 的 `dark:` 变体仍是**默认的媒体查询版**（跟随系统 `prefers-color-scheme`），
  与站点的 `data-theme` 无关；`src/components/ui/**` 里的 `dark:*` 规则不受主题选择器控制。

### 10.2 `@theme inline`（桥接层，`styles.css:82-128`）

```css
@theme inline {
  --font-sans: 'Geist Variable', sans-serif;
  --font-mono: 'JetBrains Mono Variable', monospace;

  /* 主题语义 token → Tailwind 颜色名 */
  --color-bg-deep: var(--t-bg-deep);
  --color-bg: var(--t-bg);
  --color-surface: var(--t-surface);
  --color-surface-2: var(--t-surface-2);
  --color-border-subtle: var(--t-border-subtle);
  --color-border-strong: var(--t-border-strong);
  --color-text: var(--t-text);
  --color-text-secondary: var(--t-text-secondary);
  --color-text-muted: var(--t-text-muted);
  --color-brand: var(--t-brand);
  --color-brand-soft: var(--t-brand-soft);
  --color-brand-fill: var(--t-brand);      /* 别名 */
  --color-brand-ink: var(--t-brand-ink);   /* 别名 */

  /* 固定强调色（不随主题） */
  --color-tn-blue:   oklch(0.719 0.132 264.2);
  --color-tn-purple: oklch(0.751 0.134 299.5);
  --color-tn-cyan:   oklch(0.82 0.105 235.7);
  --color-tn-orange: oklch(0.787 0.137 50.6);
  --color-tn-red:    oklch(0.723 0.159 10.3);
  --color-tn-yellow: oklch(0.784 0.106 75.4);

  /* shadcn token bridge（见 1.4） */
  --color-background: var(--t-bg);
  …
  --color-ring: var(--t-brand);
}
```

**为什么必须 `inline`**：`--color-*` 的值本身是 `var(--t-*)` 引用。不用 `inline` 时，工具类会输出
`background-color: var(--color-bg)`，而 `--color-bg` 在 `:root` 上被解析成 `var(--t-bg)`，一旦在
`[data-theme]` 子树里使用，解析位置与使用位置不一致就会取到继承错误的值。`inline` 让工具类直接输出
`background-color: var(--t-bg)`，作用域解析发生在**使用处**——这正是主题能挂任意子树、能实时预览的前提。

### 10.3 `@theme`（真实运行时变量，`styles.css:130-146`）

```css
@theme {
  --measure: 48rem;       /* 非 Tailwind 命名空间：仍会作为 :root 变量输出，用 max-w-(--measure) 消费 */
  --radius-xs: 0px; … --radius-4xl: 0px;
  --z-nav: 100; --z-dropdown: 200; --z-modal: 300; --z-tooltip: 400;
}
```

两块的差别就是本仓库 token 体系的分水岭：

| 块 | 变量是否作为运行时 CSS 变量存在 | 消费方式 |
| --- | --- | --- |
| `@theme inline` | 否（值被内联进工具类） | `bg-bg` / `text-brand` / `border-border-subtle` 等工具类；手写 CSS 用 `--t-*` |
| `@theme` | 是 | Tailwind 类（`rounded-*`）＋ 变量简写 `z-(--z-nav)`、`max-w-(--measure)` |

### 10.4 站点自定义类（非 Tailwind 工具，需一并复刻）

| 类 | 归属 | 作用 |
| --- | --- | --- |
| `.pixel-container` / `--pxc` / `--pxr` | 顶层 | 81×50 像素栅格推导（容器查询单位 `cqw`） |
| `.rail-column` / `.rail-bare` | `@layer components` | 全出血轨道对齐 + 隐藏原生滚动条 |
| `.ring-elevation` / `.ring-elevation-hover` | 顶层 | 1px 层级描边 |
| `.img-outlined` | 顶层 | 图片 1px 内描边 |
| `.scroll-accent` | 顶层 | 强调色滚动条 |
| `.no-transitions` | 顶层 | 切主题时全局禁过渡 |
| `.prose` / `.prose.principles` | 顶层 | 移植内容的正文样式（含表格、代码、引用、图注） |
| `.ported` / `.docs` | 顶层 | 移植页面与集市文档的结构样式 |
| `.manual-chapter` / `.manual__hash` / `.manual__heading-link` | 顶层 | 手册锚点与标题链接 |
| `[data-nav-blend]` / `[data-nav-ghost]` / `[data-nav-past-hero]` / `[data-nav-menu]` | 属性选择器 | 导航状态机 |
| `.dark-scope` | 属性级 token 覆盖 | 局部固定深色 |
| `.typed-caret` / `.hero-caret` / `.hero-canvas-in` / `.notice-in` / `.meetup-pin-in` / `.music-ring` / `.team-*` / `.mark-draw*` / `.voices` / `.footer-rise` | 顶层 | 动效钩子 |
| `.page-subtitle` | 顶层 | 页面副标题等宽字体 |

### 10.5 构建与组件约定

| 项 | 值 |
| --- | --- |
| Tailwind 版本 | `tailwindcss` 4.3.3 + `@tailwindcss/vite` 4.3.3（Vite 插件，非 PostCSS） |
| 动画库 | `tw-animate-css` 1.4.0 |
| 组件基元 | `@base-ui/react` 1.7.0（**不是** Radix） |
| 变体工具 | `class-variance-authority` 0.7.1 |
| `components.json` | `style: "base-nova"`、`rsc: false`、`tsx: true`、`baseColor: "neutral"`、`cssVariables: true`、`prefix: ""`、`iconLibrary: "lucide"`、`menuColor: "default"`、`menuAccent: "subtle"`、别名 `@/components`、`@/lib/utils`、`@/components/ui` |
| `astro.config.mjs` | `output: 'static'`、`server.port: 3113`、`trailingSlash: 'ignore'`、`build.format: 'directory'`、`outDir: './dist/client'`（en）、集成 `@astrojs/react`、别名 `@` 与 `#` → `src`、`@tanstack/react-router` → 本地 shim |
| 组件目录 | `src/components/ui/**` 11 个（button、badge、dialog、input、scroll-area、select、separator、skeleton、tabs、toggle、toggle-group、tooltip）；线上实际启用的只有 button、tooltip、scroll-area；Select 与 Badge 只在 `src/parked/**` 使用；Input、Skeleton、Separator、Dialog、Tabs 与 Toggle 未被任何页面引用 |

---

## 11. 照着复刻的最短清单

1. 8 个 `--radius-*` = `0px`；只保留 `rounded-full` 给圆形。
2. `html, body` 设 `font-family: var(--font-mono)`；`h1`–`h6` 设 `var(--font-sans)`；需要 sans 的 UI 标签显式 `font-sans`。
3. `@theme inline` 里把 `--color-*` 全部指向 `--t-*`，并补齐 shadcn 那 16 个名字。
4. 主题写在 `[data-theme='id']` 上，覆盖同一组 `--t-*`；每个主题都给 `color-scheme`。
5. 层级用 `.ring-elevation`（`0 0 0 1px …`）+ `.ring-elevation-hover`（150ms ease-out 只改 alpha），不用投影。
6. 焦点环统一 `outline: 2px solid var(--t-brand); outline-offset: 2px`；滚动容器里改 `-2px`；卡片场景内缩。
7. 默认过渡 `150ms ease-out`；所有动画都要有 `prefers-reduced-motion: reduce` 分支。
8. z-index 只用 100 / 200 / 300 / 400 四档，通过 `z-(--z-*)` 消费。
9. 容器 `mx-auto max-w-6xl px-4 sm:px-6`；正文 `--measure: 48rem`；章节 `py-12` → `lg:py-24/28`。
10. 主题切换若要动画：`@property --theme-wipe` + `view-transition-name` + 100deg 裂缝遮罩 + 200ms `cubic-bezier(0.7,0,1,1)`。

---

## 附：分析覆盖的文件

| 文件 | 行数 | 提取内容 |
| --- | --- | --- |
| `src/styles.css` | 2380 | 全部 token、主题块、`@theme`/`@theme inline`、prose、组件类、动效、焦点样式 |
| `src/theme-transition.css` | 137 | 主题切换裂缝机制全文 |
| `src/lib/theme-transition.ts` / `.test.ts` | 80+ | 切换时序、降级条件、`theme-wipe-frosted` 生命周期 |
| `src/lib/theme.ts` / `src/lib/site-themes.ts` | 60+/32 | 主题 id 清单、默认主题、存储键、明暗分组、favicon 重绘 |
| `src/layouts/Base.astro` | 120 | 跳转链接、容器骨架、字体 preload、`theme-color` |
| `src/components/ui/*.tsx` | 11 文件 | button/badge/input/select/tabs/toggle(-group)/tooltip/dialog/scroll-area/separator/skeleton 的完整类串 |
| `src/components/*.tsx` | 40+ 文件 | 导航、卡片、搜索面板、主题选择器、轨道、头像簇、音乐卡、安装命令的实测类串 |
| `src/astro/pages/*.tsx` | 8 文件 | 容器宽度、section 节奏、栅格、标题配方 |
| `src/i18n/international.css` | 6 | RTL 下代码方向处理 |
| `components.json` / `astro.config.mjs` / `package.json` | — | Tailwind v4 / shadcn / Astro 组织方式与版本 |

