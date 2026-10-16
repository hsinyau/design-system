/**
 * 可供切换的主题清单。选择器与文档页都从这里取，新增主题时改这里 + tokens.css。
 *
 * 色卡不用写死颜色：把 data-theme={id} 放在色卡容器上，它就会解析成该主题的
 * token（token 是普通自定义属性，任何子树都能局部覆盖）。
 */
export interface SiteTheme {
  /** 对应 tokens.css 里的 [data-theme='…'] */
  id: string
  label: string
  hint: string
  /** 用于 <meta name="color-scheme"> 与文档分组 */
  light: boolean
}

export const siteThemes: SiteTheme[] = [
  {
    id: 'dark',
    label: '深色',
    hint: '深蓝紫底，绿调强调',
    light: false,
  },
  {
    id: 'light',
    label: '亮色',
    hint: '暖白纸感，靛蓝强调',
    light: true,
  },
  {
    id: 'rose',
    label: 'Rose Pine',
    hint: '米白玫瑰底，青绿强调',
    light: true,
  },
]

export const defaultTheme = 'dark'

export const isThemeId = (value: string | null | undefined): boolean =>
  typeof value === 'string' && siteThemes.some((theme) => theme.id === value)
