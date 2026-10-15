import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// 静态文档站：构建产物在 dist/，可直接部署到任意静态托管。
export default defineConfig({
  output: 'static',
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
  },
})
