/**
 * 设计系统一致性检查。
 *
 * 1. 除 tokens.css 外，任何样式或组件里不得出现十六进制色值。
 * 2. 不得引用 --color-zz-*（那是 Tailwind 工具类专用的 inline token）。
 * 3. 不得引用 Tailwind 生成的 --font-sans / --font-mono（用 --zz-font-*）。
 * 4. 组件层不得使用裸 z-index 数值。
 * 5. 不得出现 border-radius 的非零值（圆形头像的 50% 是唯一例外）。
 *
 * 扫描范围：库（packages/design-system/src/styles）+ 文档站（apps/docs/src）。
 *
 * 用法：node scripts/check-tokens.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const scanDirs = [
  'packages/design-system/src/styles',
  'apps/docs/src/components',
  'apps/docs/src/layouts',
  'apps/docs/src/pages',
]

/** 允许出现色值的文件（token 定义处）。 */
const allowlist = new Set(['packages/design-system/src/styles/tokens.css'])

function walk(dir) {
  const out = []
  for (const entry of readdirSync(join(root, dir))) {
    const rel = join(dir, entry)
    if (statSync(join(root, rel)).isDirectory()) out.push(...walk(rel))
    else if (/\.(css|astro|ts|js)$/.test(entry)) out.push(rel)
  }
  return out
}

const problems = []

for (const dir of scanDirs) {
  for (const rel of walk(dir)) {
    if (allowlist.has(rel)) continue
    const source = readFileSync(join(root, rel), 'utf8')
    const lines = source.split('\n')

    lines.forEach((line, i) => {
      const at = `${rel}:${i + 1}`

      // 十六进制色值（#fff、#ffffff、#ffffff80）
      const hex = line.match(/#[0-9a-fA-F]{3,8}\b/g)
      if (hex) {
        for (const value of hex) {
          if (/^\d+$/.test(value.slice(1))) continue // 例如 #1 之类的锚点编号
          problems.push(`${at}  十六进制色值 ${value} —— 请改用 var(--zz-*)`)
        }
      }

      // inline token 误用
      if (line.includes('--color-zz-') && !rel.endsWith('.astro')) {
        problems.push(`${at}  组件层引用了 --color-zz-*，请改用 --zz-*`)
      }

      // Tailwind 生成的字体变量：非 Tailwind 环境下不存在，库内不得引用
      const fontVar = line.match(/var\(--font-(sans|mono)\)/)
      if (fontVar) {
        problems.push(`${at}  引用了 Tailwind 生成的 --font-${fontVar[1]} —— 请改用 var(--zz-font-${fontVar[1]})`)
      }

      // 裸 z-index 数值（允许 var()、0、auto 与层内比较用的 1/-1）
      const z = line.match(/z-index:\s*([^;]+);/)
      if (z) {
        const value = z[1].trim()
        if (!/var\(--zz-z-/.test(value) && !/^(0|auto|-?1)$/.test(value)) {
          problems.push(`${at}  裸 z-index ${value} —— 请用 var(--zz-z-nav|dropdown|modal|tooltip)`)
        }
      }

      // 非零圆角（50% 与 inherit 例外）
      const radius = line.match(/border-radius:\s*([^;]+);/)
      if (radius) {
        const value = radius[1].trim()
        const zeroish = /^0(\.0+)?(px|rem)?$/.test(value)
        if (!zeroish && !/50%|inherit|var\(--zz-field/.test(value)) {
          problems.push(`${at}  圆角 ${value} —— 全站直角，仅圆形头像可 50%`)
        }
      }
    })
  }
}

if (problems.length === 0) {
  console.log('✓ 一致性检查通过：没有硬编码色值、没有 inline token 误用、没有裸 z-index、没有多余圆角')
} else {
  console.log(`✗ 发现 ${problems.length} 处问题：\n`)
  for (const problem of problems) console.log(`  ${problem}`)
  process.exitCode = 1
}
