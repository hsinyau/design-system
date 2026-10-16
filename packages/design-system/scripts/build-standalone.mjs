/**
 * 生成框架无关的独立样式产物。
 *
 * 输入：src/styles/index.css 的 @import 列表（递归内联）
 * 输出：
 *   dist/design-system.css   单文件样式，非 Tailwind 项目可直接引入
 *   dist/fonts/*.woff2       字体文件，与产物放同一目录，相对路径自洽
 *
 * 与 Tailwind 项目用法的差异只有两点：
 *   1. 剔除 @theme / @theme inline 块 —— Tailwind 专有指令，独立环境无意义；
 *   2. 顶部显式声明层序，替代 @import 'tailwindcss' 的层序声明。
 *
 * 用法：node scripts/build-standalone.mjs
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = fileURLToPath(new URL('..', import.meta.url))
const entry = resolve(pkgRoot, 'src/styles/index.css')
const fontsDir = resolve(pkgRoot, 'src/styles/fonts')
const outDir = resolve(pkgRoot, 'dist')

/** 剔除 @theme / @theme inline 块（按大括号配对跳过整块）。 */
function stripThemeBlocks(css) {
  const start = /^[ \t]*@theme\b[^{]*\{/gm
  let out = ''
  let cursor = 0

  for (let match = start.exec(css); match; match = start.exec(css)) {
    const open = match.index + match[0].length - 1
    let depth = 0
    let end = open

    for (; end < css.length; end += 1) {
      if (css[end] === '{') depth += 1
      else if (css[end] === '}') {
        depth -= 1
        if (depth === 0) break
      }
    }

    if (depth !== 0) throw new Error(`@theme 块没有闭合：${open}`)

    out += css.slice(cursor, match.index)
    out += '/* @theme 块已剔除：那是 Tailwind 专有指令，独立产物不需要。 */'
    cursor = end + 1
    start.lastIndex = cursor
  }

  return out + css.slice(cursor)
}

/** 递归内联 @import，返回单文件 CSS。 */
function bundle(file, seen = new Set()) {
  if (seen.has(file)) return ''
  seen.add(file)

  const source = stripThemeBlocks(readFileSync(file, 'utf8'))

  return source.replace(/@import\s+'([^']+)';/g, (_, spec) => {
    const target = resolve(dirname(file), spec)
    return `\n/* ---------- ${relative(pkgRoot, target)} ---------- */\n${bundle(target, seen)}`
  })
}

const header = `/* =============================================================
   zz design system · standalone build
   -------------------------------------------------------------
   由 packages/design-system/scripts/build-standalone.mjs 从
   src/styles 生成，请勿直接修改；改动请改源文件后重新构建。

   给不使用 Tailwind 的项目：整份引入即可，无需其他构建步骤。
     <link rel="stylesheet" href=".../design-system.css">

   Tailwind v4 项目请改用 @import '@hsinyau/design-system/styles.css'，
   由 Tailwind 生成 bg-zz-surface 这类工具类。
   ============================================================= */

@layer theme, base, components, utilities;
`

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const css = header + bundle(entry)
writeFileSync(resolve(outDir, 'design-system.css'), css)

// 字体与产物同目录：src/styles/fonts.css 里的 url('./fonts/…') 因此依然成立
cpSync(fontsDir, resolve(outDir, 'fonts'), {
  recursive: true,
  filter: (src) => !src.endsWith('.txt'),
})

const kb = (css.length / 1024).toFixed(1)
console.log(`✓ dist/design-system.css（${kb} kB）与 dist/fonts/ 已生成`)
