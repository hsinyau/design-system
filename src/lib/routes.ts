/**
 * 文档站的导航结构。新增页面时改这里即可，布局与首页都从这里取。
 */

export interface NavItem {
  href: string
  label: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: '开始',
    items: [{ href: '/', label: '概览' }],
  },
  {
    title: '基础',
    items: [
      { href: '/foundations/color', label: '颜色' },
      { href: '/foundations/typography', label: '排版' },
      { href: '/foundations/space', label: '间距与层级' },
      { href: '/foundations/motion', label: '动效与可访问性' },
    ],
  },
  {
    title: '组件',
    items: [
      { href: '/components/button', label: '按钮' },
      { href: '/components/card', label: '卡片' },
      { href: '/components/form', label: '表单' },
      { href: '/components/table', label: '表格' },
      { href: '/components/nav', label: '导航' },
      { href: '/components/feedback', label: '反馈' },
      { href: '/components/overlay', label: '浮层' },
      { href: '/components/prose', label: '长文与代码' },
    ],
  },
  {
    title: '扩展',
    items: [{ href: '/themes', label: '主题' }],
  },
]

export const siteName = 'zz design system'
export const siteTagline = '为终端美学而生的界面语言'
