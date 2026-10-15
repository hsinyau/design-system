/**
 * 类名交叉审计：找出在 class 属性或脚本里引用、但样式层没有定义的 zz-* 类。
 * 未定义意味着样式静默失效（拼错类名是最常见的回归）。
 *
 * 定义来源：src/styles/**\/*.css、页面与组件内的 <style> 块。
 * 引用来源：class="…" 属性、classList 调用里的字符串字面量。
 *
 * 用法：node scripts/check-classes.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

function walk(dir, test) {
  const out = []
  for (const entry of readdirSync(join(root, dir))) {
    const rel = join(dir, entry)
    if (statSync(join(root, rel)).isDirectory()) out.push(...walk(rel, test))
    else if (test(entry)) out.push(rel)
  }
  return out
}

const sourceFiles = [
  ...walk('src/styles', (n) => n.endsWith('.css')),
  ...walk('src/components', (n) => n.endsWith('.astro')),
  ...walk('src/pages', (n) => n.endsWith('.astro')),
  ...walk('src/layouts', (n) => n.endsWith('.astro')),
]

const defined = new Set()
for (const rel of sourceFiles) {
  const source = readFileSync(join(root, rel), 'utf8')
  // CSS 规则里的 .zz-xxx，以及 <style> 块里的同类写法
  for (const match of source.matchAll(/\.(zz-[a-z0-9_-]+)/g)) defined.add(match[1])
}

const declared = new Map()
const addRef = (name, rel) => {
  if (!declared.has(name)) declared.set(name, new Set())
  declared.get(name).add(rel)
}

const dynamicPrefixes = new Set()
for (const rel of sourceFiles) {
  if (!rel.endsWith('.astro')) continue
  const source = readFileSync(join(root, rel), 'utf8')

  // class="…" 属性
  for (const match of source.matchAll(/class="([^"{][^"]*)"/g)) {
    for (const token of match[1].split(/\s+/)) {
      if (/^zz-[a-z0-9_-]*$/.test(token)) {
        if (token.endsWith('-')) dynamicPrefixes.add(token)
        else addRef(token, rel)
      }
    }
  }

  // JS 里的类名字面量（classList.add('zz-x')、querySelector('.zz-x') 等）
  for (const match of source.matchAll(/['"`](zz-[a-z0-9_ -]+)['"`]/g)) {
    for (const token of match[1].split(/\s+/)) {
      if (/^zz-[a-z0-9_-]*$/.test(token) && !token.endsWith('-')) addRef(token, rel)
    }
  }
}

const missing = [...declared.keys()].filter(
  (name) => !defined.has(name) && ![...dynamicPrefixes].some((prefix) => name.startsWith(prefix)),
)

/**
 * 允许清单：这三处不是样式类。
 * - zz-theme / zz-design-system：localStorage 键名与包名
 * - zz-swatch：纯结构钩子（.zz-swatch 本身无样式，视觉由 __chip / __name / __use 承担）
 */
const allowlist = new Set(['zz-theme', 'zz-design-system', 'zz-swatch'])
const real = missing.filter((name) => !allowlist.has(name)).sort()

console.log(`样式层定义 ${defined.size} 个类；源码引用 ${declared.size} 个类`)
if (real.length === 0) {
  console.log('✓ 没有未定义的类名')
} else {
  console.log(`✗ ${real.length} 个类被引用但未定义：`)
  for (const name of real) {
    console.log(`  ${name}  ← ${[...declared.get(name)].join(', ')}`)
  }
  process.exitCode = 1
}
